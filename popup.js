// popup.js — renders the BurnoutCheck popup from background state.

const COLORS = {
  green: "#1D9E75",
  yellow: "#BA7517",
  red: "#E24B4A"
};

const STATUS_TEXT = {
  green: "Focused",
  yellow: "Scattered",
  red: "Burnout risk rising"
};

document.addEventListener("DOMContentLoaded", () => {
  // Ask the background worker for the latest scored state.
  chrome.runtime.sendMessage({ type: "get_state" }, (state) => {
    if (chrome.runtime.lastError || !state) {
      // No background response — render an empty/neutral popup.
      renderScore(0, "green");
      renderTriggers([], "green");
      renderIntervention("");
      renderActions("green", []);
      renderSparkline([], "green");
      loadStats();
      return;
    }
    const status = state.lastStatus || "green";
    renderScore(state.lastScore ?? 0, status);
    renderTriggers(state.lastTriggers || [], status);
    renderIntervention(state.lastIntervention || "");
    renderActions(status, state.lastTriggers || []);
    renderSparkline(state.scoreHistory || [], status);
    loadStats(state);
  });
});

function colorFor(status) {
  return COLORS[status] || COLORS.green;
}

// --- Score ring -----------------------------------------------------------
function renderScore(score, status) {
  const color = colorFor(status);

  const dot = document.getElementById("statusDot");
  if (dot) dot.style.background = color;

  const num = document.getElementById("scoreNum");
  if (num) {
    num.textContent = String(score);
    num.style.color = color;
  }

  const label = document.getElementById("statusLabel");
  if (label) label.textContent = STATUS_TEXT[status] || "—";

  const canvas = document.getElementById("ring");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 60;
  const lineWidth = 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gray track.
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#ededed";
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // Colored arc from top.
  const start = -Math.PI / 2;
  const end = (score / 100) * 2 * Math.PI - Math.PI / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, end);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();
}

// --- Trigger pills ---------------------------------------------------------
function renderTriggers(triggers, status) {
  const container = document.getElementById("triggers");
  if (!container) return;
  container.innerHTML = "";
  const color = colorFor(status);
  triggers.forEach((t) => {
    const span = document.createElement("span");
    span.className = "trigger-pill";
    span.textContent = t;
    span.style.background = color + "18"; // ~10% opacity
    span.style.color = color;
    container.appendChild(span);
  });
}

// --- Intervention ----------------------------------------------------------
function renderIntervention(text) {
  const box = document.getElementById("intervention");
  if (!box) return;
  box.textContent = text || "";
  box.style.display = text ? "block" : "none";
}

// --- Action buttons --------------------------------------------------------
function renderActions(status, triggers) {
  const container = document.getElementById("actions");
  if (!container) return;
  container.innerHTML = "";

  const lowerTriggers = (triggers || []).map((t) => t.toLowerCase());

  // Reset button (yellow/red).
  if (status === "yellow" || status === "red") {
    addButton(container, "Take a 3-min reset", () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("reset.html") });
      window.close();
    });
  }

  // Close distraction tabs (any "tab" trigger).
  if (lowerTriggers.some((t) => t.includes("tab"))) {
    addButton(container, "Close distraction tabs", () => {
      closeDistractionTabs();
    });
  }

  // Focus mode (switching / spiral).
  if (lowerTriggers.some((t) => t.includes("switching") || t.includes("spiral"))) {
    addButton(container, "Focus for 20 minutes", () => {
      chrome.alarms.create("focusEnd", { delayInMinutes: 20 });
      window.close();
    });
  }

  // Late-night stop time.
  if (lowerTriggers.some((t) => t.includes("late"))) {
    addButton(container, "Set a stop time (30 min)", () => {
      chrome.alarms.create("stopTime", { delayInMinutes: 30 });
      window.close();
    });
  }
}

function addButton(container, label, onClick) {
  const btn = document.createElement("button");
  btn.className = "action-btn";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  container.appendChild(btn);
}

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

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_) {
    return "";
  }
}

function closeDistractionTabs() {
  chrome.tabs.query({}, (tabs) => {
    const ids = [];
    tabs.forEach((t) => {
      const host = hostnameOf(t.url || t.pendingUrl || "");
      if (host && DISTRACTION_DOMAINS.some((d) => host === d || host.endsWith("." + d))) {
        ids.push(t.id);
      }
    });
    if (ids.length) chrome.tabs.remove(ids);
    window.close();
  });
}

// --- Sparkline -------------------------------------------------------------
function renderSparkline(history, status) {
  const canvas = document.getElementById("sparkline");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (!history || history.length < 2) {
    // Flat gray line.
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.strokeStyle = "#dcdcdc";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return;
  }

  const pad = 3;
  const n = history.length;
  const color = colorFor(status);

  ctx.beginPath();
  history.forEach((entry, i) => {
    const x = (i / (n - 1)) * (w - pad * 2) + pad;
    // Higher score = more stressed = drawn higher (smaller y).
    const score = Math.max(0, Math.min(100, entry.score || 0));
    const y = h - pad - (score / 100) * (h - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.stroke();
}

// --- Live stats ------------------------------------------------------------
function loadStats(state) {
  // Tab count is live from the popup's own query.
  chrome.tabs.query({}, (tabs) => {
    const el = document.getElementById("statTabs");
    if (el) el.textContent = String(tabs.length);
  });
  // Switch rate / session minutes are background-only; leave as "–" unless we
  // can derive session minutes from lastUpdated history start.
  const switches = document.getElementById("statSwitches");
  const session = document.getElementById("statSession");
  if (switches) switches.textContent = "–";
  if (session) session.textContent = "–";
}
