// background.js — BurnoutCheck service worker.
// Collects tab-behavior signals, scores them (Supabase Edge Function or local
// fallback), updates the badge, fires notifications, and answers popup queries.
//
// PRIVACY: This reads tab counts, URLs, titles and timing only. It never reads
// page content.

import { postToSupabase, SUPABASE_URL, SUPABASE_KEY } from "./supabase.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SCORE_ENDPOINT = SUPABASE_URL + "/functions/v1/score";
const READING_ENDPOINT = SUPABASE_URL + "/rest/v1/browser_readings";

const DISTRACTION_DOMAINS = [
  "youtube.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "instagram.com",
  "tiktok.com",
  "netflix.com",
  "twitch.tv",
  "facebook.com",
  "discord.com"
];

const STRESS_KEYWORDS = [
  "deadline",
  "extension",
  "late",
  "overdue",
  "urgent",
  "stuck",
  "help",
  "how to",
  "when is",
  "am i",
  "can't",
  "cannot",
  "failing",
  "behind",
  "missed",
  "forgot",
  "procrastinat"
];

// ---------------------------------------------------------------------------
// In-memory rolling state. A service worker can be torn down at any time, so
// anything that must survive (frustrationCount, sessionStart) is also mirrored
// into chrome.storage.local and rehydrated on wake.
// ---------------------------------------------------------------------------
let tabSwitchEvents = []; // array of timestamps (ms)
let lastActiveTabId = null;
let sessionStart = Date.now();
let lastDistractionMs = null;
let frustrationCount = 0;

// Rehydrate volatile state when the worker spins back up.
(async function rehydrate() {
  try {
    const stored = await chrome.storage.local.get([
      "sessionStart",
      "lastDistractionMs",
      "frustrationCount",
      "tabSwitchEvents"
    ]);
    if (typeof stored.sessionStart === "number") sessionStart = stored.sessionStart;
    if (typeof stored.lastDistractionMs === "number") lastDistractionMs = stored.lastDistractionMs;
    if (typeof stored.frustrationCount === "number") frustrationCount = stored.frustrationCount;
    if (Array.isArray(stored.tabSwitchEvents)) tabSwitchEvents = stored.tabSwitchEvents;
  } catch (e) {
    console.warn("[BurnoutCheck] rehydrate failed:", e && e.message);
  }
})();

async function persistVolatile() {
  try {
    await chrome.storage.local.set({
      sessionStart,
      lastDistractionMs,
      frustrationCount,
      tabSwitchEvents
    });
  } catch (e) {
    /* storage best-effort */
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_) {
    return "";
  }
}

function isDistraction(url) {
  const host = hostnameOf(url);
  if (!host) return false;
  return DISTRACTION_DOMAINS.some(
    (d) => host === d || host.endsWith("." + d)
  );
}

function matchesStressKeyword(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return STRESS_KEYWORDS.some((kw) => lower.includes(kw));
}

function statusFromScore(score) {
  if (score <= 33) return "green";
  if (score <= 66) return "yellow";
  return "red";
}

// ---------------------------------------------------------------------------
// Lifecycle: register alarms on install AND on startup so the worker recovers
// after a browser restart.
// ---------------------------------------------------------------------------
function registerAlarms() {
  chrome.alarms.create("collectAndScore", { periodInMinutes: 5 });
  chrome.alarms.create("pruneState", { periodInMinutes: 1 });
}

chrome.runtime.onInstalled.addListener(() => {
  sessionStart = Date.now();
  lastDistractionMs = null;
  frustrationCount = 0;
  tabSwitchEvents = [];
  persistVolatile();
  registerAlarms();
  // Prime the badge so the icon is meaningful before the first cycle.
  collectAndScore();
});

chrome.runtime.onStartup.addListener(() => {
  sessionStart = Date.now();
  tabSwitchEvents = [];
  persistVolatile();
  registerAlarms();
  collectAndScore();
});

// ---------------------------------------------------------------------------
// Tab switch tracking
// ---------------------------------------------------------------------------
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Only count genuine switches (a different tab gaining focus).
  if (activeInfo.tabId !== lastActiveTabId) {
    tabSwitchEvents.push(Date.now());
    lastActiveTabId = activeInfo.tabId;
  }
  // If the newly active tab is a distraction, mark the moment.
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && isDistraction(tab.url || tab.pendingUrl || "")) {
      lastDistractionMs = Date.now();
    }
  } catch (_) {
    /* tab may have closed */
  }
  persistVolatile();
});

// ---------------------------------------------------------------------------
// Alarms
// ---------------------------------------------------------------------------
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "collectAndScore") {
    collectAndScore();
  } else if (alarm.name === "pruneState") {
    pruneState();
  } else if (alarm.name === "focusEnd") {
    showSimpleNotification("Focus session complete", "Nice work. Your 20-minute focus block is done.");
  } else if (alarm.name === "stopTime") {
    showSimpleNotification("Time to stop", "It's your stop time. Close the laptop — tomorrow you'll thank yourself.");
  }
});

function pruneState() {
  const cutoff = Date.now() - 10 * 60 * 1000; // keep last 10 minutes
  tabSwitchEvents = tabSwitchEvents.filter((ts) => ts >= cutoff);
  persistVolatile();
}

// ---------------------------------------------------------------------------
// Core: collect signals, score, store, badge, notify
// ---------------------------------------------------------------------------
async function collectAndScore() {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({});
  } catch (e) {
    console.warn("[BurnoutCheck] tabs.query failed:", e && e.message);
  }

  const now = Date.now();
  const tab_count = tabs.length;

  let distraction_count = 0;
  let stress_search_count = 0;
  const urlCounts = {};

  for (const t of tabs) {
    const url = t.url || t.pendingUrl || "";
    const title = t.title || "";
    if (isDistraction(url)) distraction_count++;
    if (matchesStressKeyword(title) || matchesStressKeyword(url)) stress_search_count++;
    if (url) urlCounts[url] = (urlCounts[url] || 0) + 1;
  }

  let duplicate_tabs = 0;
  for (const u in urlCounts) {
    if (urlCounts[u] > 1) duplicate_tabs += urlCounts[u] - 1;
  }

  const distraction_ratio =
    tab_count > 0 ? Math.round((distraction_count / tab_count) * 100) / 100 : 0;

  const fiveMinAgo = now - 5 * 60 * 1000;
  const switchesLast5 = tabSwitchEvents.filter((ts) => ts >= fiveMinAgo).length;
  const switch_rate_per_min = Math.round((switchesLast5 / 5) * 100) / 100;
  const spiral_mode = switch_rate_per_min > 5;

  const session_minutes = Math.max(0, Math.round((now - sessionStart) / 60000));
  const unbroken_work_min =
    lastDistractionMs != null
      ? Math.max(0, Math.round((now - lastDistractionMs) / 60000))
      : session_minutes;

  const hour_of_day = new Date().getHours();
  const late_night = hour_of_day >= 22 || hour_of_day <= 5;
  const frustration_events = frustrationCount;

  const features = {
    tab_count,
    distraction_count,
    distraction_ratio,
    duplicate_tabs,
    stress_search_count,
    switch_rate_per_min,
    spiral_mode,
    session_minutes,
    unbroken_work_min,
    late_night,
    hour_of_day,
    frustration_events,
    ts: now
  };

  // Fire-and-forget raw reading insert.
  postToSupabase(READING_ENDPOINT, features);

  // Score: try the Edge Function, fall back to local heuristic.
  let result = await postToSupabase(SCORE_ENDPOINT, features);
  if (!result || typeof result.score !== "number") {
    result = localFallbackScore(features);
  }

  const score = Math.max(0, Math.min(100, Math.round(result.score)));
  const status = result.status || statusFromScore(score);
  const triggers = Array.isArray(result.triggers) ? result.triggers : [];
  const intervention = result.intervention || "";

  // History: append and trim to last 7 days.
  let scoreHistory = [];
  try {
    const stored = await chrome.storage.local.get("scoreHistory");
    if (Array.isArray(stored.scoreHistory)) scoreHistory = stored.scoreHistory;
  } catch (_) {}
  scoreHistory.push({ score, status, ts: now });
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  scoreHistory = scoreHistory.filter((e) => e.ts >= weekAgo);

  // Detect yellow/green -> red transition for notification.
  let prevStatus = "green";
  try {
    const stored = await chrome.storage.local.get("prevStatus");
    if (stored.prevStatus) prevStatus = stored.prevStatus;
  } catch (_) {}

  await chrome.storage.local.set({
    lastScore: score,
    lastStatus: status,
    lastTriggers: triggers,
    lastIntervention: intervention,
    lastUpdated: now,
    scoreHistory,
    prevStatus: status
  });

  // Reset the frustration counter for the next window.
  frustrationCount = 0;
  await persistVolatile();

  updateBadge(score, status);

  if (status === "red" && prevStatus !== "red") {
    showNotification(intervention || "You're spiraling. Pick one tab and breathe.");
  }
}

// ---------------------------------------------------------------------------
// Local fallback scorer — keeps the extension fully functional offline / before
// the Supabase project exists.
// ---------------------------------------------------------------------------
function localFallbackScore(f) {
  let score = 0;

  if (f.tab_count > 20) score += 20;
  else if (f.tab_count > 10) score += 10;

  if (f.switch_rate_per_min > 5) score += 25;
  else if (f.switch_rate_per_min > 2) score += 12;

  if (f.spiral_mode) score += 15;
  if (f.distraction_ratio > 0.5) score += 15;
  if (f.stress_search_count > 2) score += 10;
  if (f.late_night) score += 10;
  if (f.frustration_events > 2) score += 5;

  score = Math.min(100, score);
  const status = statusFromScore(score);

  // Build triggers from whichever signals are high.
  const triggers = [];
  if (f.tab_count > 10) triggers.push(f.tab_count + " tabs open");
  if (f.switch_rate_per_min > 2) {
    const secs = f.switch_rate_per_min > 0 ? Math.round(60 / f.switch_rate_per_min) : 0;
    triggers.push("switching every " + secs + "s");
  }
  if (f.spiral_mode) triggers.push("spiral mode");
  if (f.distraction_ratio > 0.5)
    triggers.push(Math.round(f.distraction_ratio * 100) + "% distraction tabs");
  if (f.stress_search_count > 2) triggers.push(f.stress_search_count + " stress searches");
  if (f.duplicate_tabs > 0) triggers.push(f.duplicate_tabs + " duplicate tabs");
  if (f.late_night) triggers.push("late night");
  if (f.frustration_events > 2) triggers.push("rapid backspacing");

  // Intervention keyed to status + the strongest signal.
  let intervention;
  if (status === "green") {
    intervention = "You're focused. Keep going.";
  } else if (status === "yellow") {
    if (f.spiral_mode || f.switch_rate_per_min > 2) {
      intervention = "You're getting scattered. Park the side quests and finish one thing.";
    } else if (f.tab_count > 10) {
      intervention = "Tabs are piling up. Close what you're done with.";
    } else if (f.late_night) {
      intervention = "It's late. Decide on a real stop time.";
    } else {
      intervention = "A little scattered. Take a breath and refocus.";
    }
  } else {
    if (f.spiral_mode || f.switch_rate_per_min > 5) {
      intervention = "You're not working, you're spiraling. Pick one tab.";
    } else if (f.tab_count > 20) {
      intervention = "Too many tabs. Close the noise — you can't think through this much.";
    } else if (f.late_night) {
      intervention = "It's late and you're redlining. Stop for tonight.";
    } else {
      intervention = "Burnout risk is rising. Step away for three minutes.";
    }
  }

  return { score, status, triggers, intervention };
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
function updateBadge(score, status) {
  let color = "#1D9E75";
  let text = "OK";
  if (status === "yellow") {
    color = "#BA7517";
    text = "!!";
  } else if (status === "red") {
    color = "#E24B4A";
    text = "!!";
  }
  try {
    chrome.action.setBadgeBackgroundColor({ color });
    chrome.action.setBadgeText({ text });
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
function showNotification(message) {
  try {
    chrome.notifications.create("burnout_red", {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "BurnoutCheck",
      message: message || "Burnout risk rising. Take a reset.",
      priority: 2,
      buttons: [{ title: "Take a 3-min reset" }]
    });
  } catch (e) {
    console.warn("[BurnoutCheck] notification failed:", e && e.message);
  }
}

function showSimpleNotification(title, message) {
  try {
    chrome.notifications.create("burnout_info_" + title, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: title,
      message: message,
      priority: 1
    });
  } catch (_) {}
}

chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  if (notifId === "burnout_red" && btnIdx === 0) {
    chrome.tabs.create({ url: chrome.runtime.getURL("reset.html") });
  }
});

chrome.notifications.onClicked.addListener((notifId) => {
  if (notifId === "burnout_red") {
    chrome.tabs.create({ url: chrome.runtime.getURL("reset.html") });
  }
});

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  if (msg.type === "get_state") {
    chrome.storage.local
      .get([
        "lastScore",
        "lastStatus",
        "lastTriggers",
        "lastIntervention",
        "lastUpdated",
        "scoreHistory"
      ])
      .then((data) => {
        sendResponse({
          lastScore: data.lastScore ?? 0,
          lastStatus: data.lastStatus ?? "green",
          lastTriggers: data.lastTriggers ?? [],
          lastIntervention: data.lastIntervention ?? "",
          lastUpdated: data.lastUpdated ?? null,
          scoreHistory: data.scoreHistory ?? []
        });
      });
    return true; // async response
  }

  if (msg.type === "frustration_event") {
    frustrationCount++;
    persistVolatile();
    return false;
  }

  if (msg.type === "force_rescore") {
    collectAndScore().then(() => sendResponse({ ok: true }));
    return true;
  }
});
