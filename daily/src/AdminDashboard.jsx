import { useEffect, useState } from "react";

function StatCard({ icon, label, value, color }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div className="admin-stat-body">
        <span className="admin-stat-label">{label}</span>
        <span className="admin-stat-value">{value ?? "—"}</span>
      </div>
    </div>
  );
}

function AdminDashboard({ user, onBack }) {
  const [stats, setStats]         = useState(null);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filter, setFilter]       = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast]         = useState(null); // { msg, ok }

  const headers = { Authorization: `Bearer ${user.token}` };

  // ── Load dashboard + users ────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.token) {
      setError("Authentication token missing. Please log in again.");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [dr, ur] = await Promise.all([
          fetch("/api/admin/dashboard", { headers }),
          fetch("/api/admin/users",     { headers }),
        ]);

        const dd = await dr.json();
        const ud = await ur.json();

        if (!dr.ok) throw new Error(dd.message || "Failed to load dashboard.");
        if (!ur.ok) throw new Error(ud.message || "Failed to load users.");

        setStats(dd.statistics);
        setUsers(ud.users || []);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  // ── Role change ───────────────────────────────────────────────────────────
  async function changeRole(userId, newRole) {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed.");

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      // Recalculate admin count
      setStats((prev) => ({
        ...prev,
        totalAdmins: users.filter(
          (u) => (u._id === userId ? newRole === "admin" : u.role === "admin")
        ).length,
      }));
      showToast(`Role updated to "${newRole}".`, true);
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setUpdatingId(null);
    }
  }

  function showToast(msg, ok) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Filtered users ────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q = filter.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const regularUsers = users.filter((u) => u.role === "user").length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading dashboard…</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="admin-error">
        <div className="admin-error-icon">⚠️</div>
        <h2>Access Error</h2>
        <p>{error}</p>
        <button className="admin-back-btn" onClick={onBack}>
          ← Back to News
        </button>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="admin-shell">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span className="admin-logo-mark">D</span>
          <span>DailyNews</span>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-item active">
            <span className="admin-nav-icon">📊</span>
            Dashboard
          </div>
          <div className="admin-nav-item">
            <span className="admin-nav-icon">👥</span>
            Users
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-profile">
            <div className="admin-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="admin-profile-info">
              <span className="admin-profile-name">{user.name}</span>
              <span className="admin-profile-role">Administrator</span>
            </div>
          </div>
          <button className="admin-back-btn" onClick={onBack}>
            ← Back to News
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="admin-main">
        {/* Top bar */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-sub">
              Welcome back, <strong>{user.name}</strong> — here's what's happening.
            </p>
          </div>
          <div className="admin-topbar-date">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </div>
        </div>

        {/* Stat cards */}
        <div className="admin-stats-grid">
          <StatCard
            icon="👥"
            label="Total Users"
            value={stats?.totalUsers}
            color="rgba(99,102,241,.15)"
          />
          <StatCard
            icon="🛡️"
            label="Admins"
            value={stats?.totalAdmins}
            color="rgba(230,57,70,.15)"
          />
          <StatCard
            icon="📰"
            label="Regular Users"
            value={regularUsers}
            color="rgba(16,185,129,.15)"
          />
          <StatCard
            icon="📅"
            label="Last Updated"
            value={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            color="rgba(245,158,11,.15)"
          />
        </div>

        {/* Users table */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Registered Users</h2>
            <div className="admin-search-wrapper">
              <span className="admin-search-icon">🔍</span>
              <input
                className="admin-search"
                type="search"
                placeholder="Filter by name, email or role…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item, idx) => (
                  <tr key={item._id || item.id}>
                    <td className="admin-td-num">{idx + 1}</td>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="admin-td-email">{item.email}</td>
                    <td>
                      <span className={`admin-role-badge admin-role-${item.role}`}>
                        {item.role === "admin" ? "🛡️ Admin" : "👤 User"}
                      </span>
                    </td>
                    <td className="admin-td-date">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      {item._id === user.id ? (
                        <span className="admin-you-badge">You</span>
                      ) : (
                        <button
                          className={`admin-role-btn ${item.role === "admin" ? "demote" : "promote"}`}
                          disabled={updatingId === item._id}
                          onClick={() =>
                            changeRole(
                              item._id,
                              item.role === "admin" ? "user" : "admin"
                            )
                          }
                        >
                          {updatingId === item._id
                            ? "Saving…"
                            : item.role === "admin"
                            ? "Demote"
                            : "Make Admin"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="admin-empty">
                      No users match your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="admin-table-count">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </main>

      {/* Toast notification */}
      {toast && (
        <div className={`admin-toast ${toast.ok ? "admin-toast-ok" : "admin-toast-err"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
