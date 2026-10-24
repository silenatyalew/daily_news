import { useState } from "react";

function Auth({ initialMode = "login", onLoginSuccess, onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "login" : "register";
      const body = mode === "login"
        ? { email, password }
        : { name, email, password };

      const response = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status}).`);
      }

      if (mode === "register") {
        setMessage("Registration successful! Please log in.");
        setMessageType("success");
        setMode("login");
        setName("");
        setPassword("");
        return;
      }

      if (!data.token) throw new Error("Login token was not received.");
      onLoginSuccess(data);

    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        {onClose && (
          <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}

        {/* Brand mark */}
        <div className="auth-logo">D</div>

        <h2>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
        <p>{mode === "login" ? "Log in to your DailyNews account." : "Join DailyNews today — it's free."}</p>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <span className="input-icon">✉️</span>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {message && (
            <p role="status" className={`auth-message${messageType === "success" ? " success" : ""}`}>
              {message}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setMessage("");
              setMessageType("error");
            }}
          >
            {mode === "login" ? " Register" : " Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;
