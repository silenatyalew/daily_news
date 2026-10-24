import { useState, useEffect } from "react";
import Auth from "./Auth.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import { fetchNews } from "./gnews.js";
import "./App.css";

const translations = {
  en: {
    logo: "DailyNews",
    home: "Home",
    ethiopia: "Ethiopia",
    world: "World",
    technology: "Technology",
    sports: "Sports",
    search: "Search news...",
    searchBtn: "Search",
    heading: "Stay Informed. Stay Ahead.",
    description: "Discover the latest news from Ethiopia and around the world.",
    latest: "Latest News",
    readMore: "Read More",
    loading: "Loading news...",
    error: "Failed to load news. Try again later.",
    errorTitle: "Couldn't load news",
    retry: "Try again",
    noNews: "No news found.",
    loginToRead: "Read Latest News",
    wallTitle: "Members Only",
    wallDesc: "Please log in or create a free account to read the latest news.",
    loginBtn: "Login",
    registerBtn: "Create free account",
  },
  am: {
    logo: "ዕለታዊ ዜና",
    home: "መነሻ",
    ethiopia: "ኢትዮጵያ",
    world: "ዓለም",
    technology: "ቴክኖሎጂ",
    sports: "ስፖርት",
    search: "ዜና ፈልግ...",
    searchBtn: "ፈልግ",
    heading: "ወቅታዊ መረጃ ይኑርዎት!",
    description: "ከኢትዮጵያና ከዓለም ዙሪያ የቅርብ ጊዜ ዜናዎችን ያግኙ።",
    latest: "የቅርብ ጊዜ ዜናዎች",
    readMore: "ተጨማሪ ያንብቡ",
    loading: "ዜና በመጫን ላይ...",
    error: "ዜናውን መጫን አልተቻለም።",
    errorTitle: "ዜና መጫን አልተቻለም",
    retry: "እንደገና ሞክር",
    noNews: "የሚፈልጉት ዜና አልተገኘም።",
    loginToRead: "የቅርብ ጊዜ ዜናዎችን ያንብቡ",
    wallTitle: "ለአባላት ብቻ",
    wallDesc: "የቅርብ ጊዜ ዜናዎችን ለማንበብ እባክዎ ይግቡ ወይም ነፃ መለያ ይፍጠሩ።",
    loginBtn: "ግባ",
    registerBtn: "ነፃ መለያ ይፍጠሩ",
  },
};

const CATEGORY_MAP = {
  ethiopia: "ethiopia",
  world: "world",
  technology: "technology",
  sports: "sports",
};

function App() {
  const [language, setLanguage]   = useState("en");
  const [category, setCategory]   = useState("general");
  const [search, setSearch]           = useState("");       // live input value
  const [submittedSearch, setSubmittedSearch] = useState(""); // value sent to API
  const [news, setNews]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [retry, setRetry]             = useState(0);

  // Auth state
  const [showAuth, setShowAuth]       = useState(false);
  const [authMode, setAuthMode]       = useState("login");
  const [currentUser, setCurrentUser] = useState(null);

  // Favorites — persisted in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dailynews-favorites")) || [];
    } catch {
      return [];
    }
  });
  const [showFavorites, setShowFavorites] = useState(false);

  // Admin dashboard
  const [showAdmin, setShowAdmin] = useState(false);

  const t = translations[language];

  // Persist favorites
  useEffect(() => {
    localStorage.setItem("dailynews-favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ── Load news directly from GNews (browser fetch — no Node firewall issue) ──
  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;

    async function loadNews() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchNews({ category, search: submittedSearch });
        if (!cancelled) setNews(data.articles || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || t.error);
          setNews([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNews();
    return () => { cancelled = true; };
  }, [category, submittedSearch, retry, currentUser, t.error]);

  // Client-side filter on already-fetched results
  const filteredNews = news.filter((item) => {
    const q = submittedSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(item.title || "").toLowerCase().includes(q) ||
      String(item.description || "").toLowerCase().includes(q)
    );
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleCategory(cat) {
    setCategory(CATEGORY_MAP[cat] || "general");
    setSearch("");
    setSubmittedSearch("");
    setShowAdmin(false);
    setShowFavorites(false);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSubmittedSearch(search.trim());
  }

  function handleSearchClear() {
    setSearch("");
    setSubmittedSearch("");
  }

  // Fixed: was broken with a nested function declaration inside the updater
  function toggleFavorite(article) {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.url === article.url);
      return exists
        ? prev.filter((item) => item.url !== article.url)
        : [...prev, article];
    });
  }

  function isFavorite(article) {
    return favorites.some((item) => item.url === article.url);
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setShowAuth(true);
  }

  function handleLoginSuccess(data) {
    setCurrentUser({ ...data.user, token: data.token });
    setShowAuth(false);
    setShowAdmin(false);
  }

  function handleLogout() {
    setCurrentUser(null);
    setShowAdmin(false);
    setShowFavorites(false);
    setAuthMode("login");
    setShowAuth(true);
  }

  // ── News grid (reused for main feed and favorites) ─────────────────────────
  function NewsGrid({ articles }) {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="spinner" aria-hidden="true"></div>
          <p>{t.loading}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-banner" role="alert">
          <span className="error-icon">⚠️</span>
          <div>
            <strong>{t.errorTitle}</strong>
            <p>{error}</p>
          </div>
          <button
            type="button"
            className="retry-btn"
            onClick={() => setRetry((v) => v + 1)}
          >
            {t.retry}
          </button>
        </div>
      );
    }

    if (articles.length === 0) {
      return (
        <div className="no-results">
          <div className="no-results-icon">📰</div>
          <p>{t.noNews}</p>
        </div>
      );
    }

    return (
      <div className="news-grid">
        {articles.map((item) => (
          <article className="news-card" key={item.url || item.title}>
            <img
              src={item.image || item.urlToImage || "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800"}
              alt={item.title || ""}
              loading="lazy"
            />
            <div className="card-content">
              <div className="card-meta">
                <span className="category">{item.source?.name || category}</span>
                {item.publishedAt && (
                  <span className="card-date">
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h3>{item.title || ""}</h3>
              <p>{item.description || item.content || ""}</p>
              <div className="card-footer">
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="read-more"
                  >
                    {t.readMore} →
                  </a>
                )}
                <button
                  type="button"
                  className="fav-btn"
                  onClick={() => toggleFavorite(item)}
                  aria-label={isFavorite(item) ? "Remove from favorites" : "Save to favorites"}
                  title={isFavorite(item) ? "Remove from favorites" : "Save to favorites"}
                >
                  {isFavorite(item) ? "⭐" : "☆"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app" lang={language}>
      {/* ── Header ── */}
      <header className="header">
        <a href="#home" className="logo" onClick={() => handleCategory("general")}>
          {t.logo}
        </a>

        <nav>
          {["home", "ethiopia", "world", "technology", "sports"].map((key) => (
            <a
              key={key}
              href={`#${key}`}
              onClick={() => handleCategory(key)}
            >
              {t[key]}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Choose language"
          >
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
          </select>

          {currentUser ? (
            <div className="user-actions">
              <span className="user-name">Hi, {currentUser.name}</span>

              <button
                type="button"
                className="auth-button"
                onClick={() => { setShowFavorites((v) => !v); setShowAdmin(false); }}
              >
                ⭐ {favorites.length}
              </button>

              {currentUser.role === "admin" && (
                <button
                  type="button"
                  className="auth-button"
                  onClick={() => { setShowAdmin(true); setShowFavorites(false); }}
                >
                  Admin
                </button>
              )}

              <button type="button" className="auth-button auth-button-primary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="user-actions">
              <button type="button" className="auth-button" onClick={() => openAuth("login")}>
                Login
              </button>
              <button type="button" className="auth-button auth-button-primary" onClick={() => openAuth("register")}>
                Register
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Admin dashboard ── */}
      {showAdmin && currentUser?.role === "admin" ? (
        <AdminDashboard user={currentUser} onBack={() => setShowAdmin(false)} />
      ) : (
        <>
          <main>
            {/* Hero */}
            <section className="hero" id="home">
              <div className="hero-content">
                <h1>{t.heading}</h1>
                <p>{t.description}</p>
                {currentUser ? (
                  <a href="#news" className="primary-button">{t.latest}</a>
                ) : (
                  <button type="button" className="primary-button" onClick={() => openAuth("login")}>
                    {t.loginToRead}
                  </button>
                )}
              </div>
            </section>

            {/* News or login wall */}
            {currentUser ? (
              <section className="news-section" id="news">
                <div className="section-header">
                  <div className="section-title">
                    <div className="section-title-bar"></div>
                    <h2>{showFavorites ? `⭐ Saved (${favorites.length})` : t.latest}</h2>
                  </div>
                  {!showFavorites && (
                    <form
                      className="search-form"
                      onSubmit={handleSearchSubmit}
                      role="search"
                    >
                      <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                          className="search-input"
                          type="search"
                          placeholder={t.search}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") handleSearchClear();
                          }}
                          aria-label={t.search}
                        />
                        {search && (
                          <button
                            type="button"
                            className="search-clear"
                            onClick={handleSearchClear}
                            aria-label="Clear search"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <button type="submit" className="search-btn">
                        {t.searchBtn}
                      </button>
                    </form>
                  )}
                </div>

                {showFavorites ? (
                  <NewsGrid articles={favorites} />
                ) : (
                  <NewsGrid articles={filteredNews} />
                )}
              </section>
            ) : (
              <section className="login-wall">
                <div className="login-wall-card">
                  <div className="login-wall-icon">🔒</div>
                  <h2>{t.wallTitle}</h2>
                  <p>{t.wallDesc}</p>
                  <div className="login-wall-actions">
                    <button type="button" className="auth-submit" onClick={() => openAuth("login")}>
                      {t.loginBtn}
                    </button>
                    <button type="button" className="wall-register-btn" onClick={() => openAuth("register")}>
                      {t.registerBtn}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </main>

          {/* Footer */}
          <footer>
            <div className="footer-grid">
              <div className="footer-brand">
                <a href="#home" className="logo" onClick={() => handleCategory("general")}>
                  {t.logo}
                </a>
                <p>Your trusted source for breaking news from Ethiopia and around the world. Stay informed, stay ahead.</p>
              </div>
              <div className="footer-col">
                <h4>Sections</h4>
                <ul>
                  {["home", "ethiopia", "world", "technology", "sports"].map((key) => (
                    <li key={key}>
                      <a href={`#${key}`} onClick={() => handleCategory(key)}>{t[key]}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="footer-col">
                <h4>Account</h4>
                <ul>
                  {currentUser ? (
                    <li>
                      <button className="footer-link-btn" onClick={handleLogout}>Logout</button>
                    </li>
                  ) : (
                    <>
                      <li><button className="footer-link-btn" onClick={() => openAuth("login")}>Login</button></li>
                      <li><button className="footer-link-btn" onClick={() => openAuth("register")}>Register</button></li>
                    </>
                  )}
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <span>{t.logo} © 2026 — All rights reserved.</span>
              <span className="footer-badge">🌍 Live News</span>
            </div>
          </footer>
        </>
      )}

      {/* Auth modal */}
      {showAuth && (
        <Auth
          key={authMode}
          initialMode={authMode}
          onLoginSuccess={handleLoginSuccess}
          onClose={currentUser ? () => setShowAuth(false) : null}
        />
      )}
    </div>
  );
}

export default App;
