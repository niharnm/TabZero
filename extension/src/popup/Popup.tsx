import { useEffect, useState } from "react";
import { analyzeTabs, workspaceUrl } from "../lib/api";
import { collectTabs, type BrowserTab } from "../lib/collectTabs";
import { WEB_APP_URL } from "../lib/config";

export function Popup() {
  const [tabCount, setTabCount] = useState(0);
  const [goal, setGoal] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    collectTabs()
      .then((tabs) => setTabCount(tabs.length))
      .catch(() => setError("Unable to read current-window tabs."));
  }, []);

  async function saveInput(tabs: BrowserTab[]) {
    await chrome.storage.local.set({
      "tabzero:lastTabs": tabs,
      "tabzero:lastGoal": goal,
      "tabzero:lastTimeRemaining": timeRemaining,
    });
  }

  async function handleAnalyze() {
    setLoading(true);
    setError("");

    try {
      const tabs = await collectTabs();
      setTabCount(tabs.length);

      if (tabs.length === 0) {
        throw new Error("Open at least one http or https tab in this window.");
      }

      await saveInput(tabs);
      const workspaceId = await analyzeTabs({ tabs, goal, timeRemaining });
      await chrome.tabs.create({ url: workspaceUrl(workspaceId) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to analyze tabs.");
    } finally {
      setLoading(false);
    }
  }

  async function openDashboard() {
    await chrome.tabs.create({ url: WEB_APP_URL });
  }

  return (
    <main className="popup-shell">
      <section className="header">
        <div>
          <h1>TabZero</h1>
          <p>Turn this window into a deadline-ready plan</p>
        </div>
        <div className="tab-count" aria-label={`${tabCount} current tabs`}>
          {tabCount}
        </div>
      </section>

      <label className="field">
        <span>What are you trying to finish?</span>
        <input
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="Submit the project demo"
          disabled={loading}
        />
      </label>

      <label className="field">
        <span>How much time is left?</span>
        <input
          value={timeRemaining}
          onChange={(event) => setTimeRemaining(event.target.value)}
          placeholder="45 minutes"
          disabled={loading}
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <div className="actions">
        <button className="primary" onClick={handleAnalyze} disabled={loading}>
          {loading ? "Building triage..." : "Triage My Tabs"}
        </button>
        <button className="secondary" onClick={openDashboard} disabled={loading}>
          Open Dashboard
        </button>
      </div>
    </main>
  );
}
