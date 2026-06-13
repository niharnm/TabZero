// supabase.js — shared Supabase helpers using raw fetch (no npm, no bundler).
// The only two strings you ever need to replace live here and in background.js.

export const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
export const SUPABASE_KEY = "YOUR_ANON_KEY";

function authHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: "Bearer " + SUPABASE_KEY
  };
}

// POST a payload to a Supabase endpoint (REST table or Edge Function).
// Returns parsed JSON on success, or null on any error. Never throws.
export async function postToSupabase(endpoint, payload) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
        ...authHeaders()
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.warn("[BurnoutCheck] postToSupabase non-OK:", res.status, endpoint);
      return null;
    }
    // Edge Functions return JSON; REST inserts with return=minimal return empty.
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (_) {
      return {};
    }
  } catch (err) {
    console.warn("[BurnoutCheck] postToSupabase failed:", err && err.message);
    return null;
  }
}

// GET from a Supabase REST endpoint. Returns parsed JSON (array) or null on error.
export async function getFromSupabase(endpoint) {
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: authHeaders()
    });
    if (!res.ok) {
      console.warn("[BurnoutCheck] getFromSupabase non-OK:", res.status, endpoint);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("[BurnoutCheck] getFromSupabase failed:", err && err.message);
    return null;
  }
}
