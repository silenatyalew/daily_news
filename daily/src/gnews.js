/**
 * GNews API helper — called directly from the browser.
 * The browser has no firewall restrictions, unlike the Node.js server process.
 */

const API_KEY = import.meta.env.VITE_GNEWS_API_KEY;
const BASE_URL = "https://gnews.io/api/v4";
const MAX = 10;

const TOPICS = new Set([
  "general", "world", "nation", "business",
  "technology", "entertainment", "sports", "science", "health",
]);

// Simple in-memory cache keyed by URL string, TTL 10 minutes
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

async function request(path, params = {}) {
  if (!API_KEY) throw new Error("VITE_GNEWS_API_KEY is not set in daily/.env");

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("token", API_KEY);
  url.searchParams.set("lang", "en");
  url.searchParams.set("max", String(MAX));

  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const key = url.toString();
  const cached = getCached(key);
  if (cached) return cached;

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    const msg = data?.errors?.[0] || `GNews error (${response.status})`;
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }

  setCache(key, data);
  return data;
}

/**
 * Fetch news articles.
 * @param {{ category?: string, search?: string }} opts
 * @returns {Promise<{ articles: Array, totalArticles: number }>}
 */
export async function fetchNews({ category = "general", search = "" } = {}) {
  const q = search.trim();

  if (q) {
    return request("/search", { q });
  }

  if (category === "ethiopia") {
    return request("/search", { q: "Ethiopia" });
  }

  const topic = TOPICS.has(category) ? category : "general";
  return request("/top-headlines", { topic });
}
