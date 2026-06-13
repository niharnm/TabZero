"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, Loader2, Lock } from "lucide-react";
import { Header } from "@/components/Header";
import { parseTabsInput } from "@/lib/utils";
import type { BrowserTab } from "@/lib/types";

const TABZERO_WEB_SOURCE = "tabzero-web";
const TABZERO_EXTENSION_SOURCE = "tabzero-extension";
const REQUEST_CURRENT_TABS = "TABZERO_REQUEST_CURRENT_TABS";
const CURRENT_TABS_RESPONSE = "TABZERO_CURRENT_TABS_RESPONSE";

type TabImportStatus = "idle" | "requesting" | "imported" | "manual";

type ExtensionTabsResponse = {
  source?: string;
  type?: string;
  requestId?: string;
  ok?: boolean;
  tabs?: BrowserTab[];
  error?: string;
};

function createRequestId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function formatTabsForTextarea(tabs: BrowserTab[]) {
  return tabs
    .map((tab) => {
      const title = tab.title?.trim() || tab.url?.trim() || "Untitled tab";
      const url = tab.url?.trim();
      return url ? `${title} - ${url}` : title;
    })
    .join("\n");
}

export default function NewWorkspacePage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tabImportStatus, setTabImportStatus] = useState<TabImportStatus>("idle");
  const [tabImportMessage, setTabImportMessage] = useState(
    "Ask your browser for the tabs in this window, or paste them manually below.",
  );

  const parsedCount = useMemo(() => parseTabsInput(raw).length, [raw]);

  async function importCurrentTabs() {
    setError("");
    setTabImportStatus("requesting");
    setTabImportMessage("Waiting for browser access...");

    const requestId = createRequestId();

    try {
      const tabs = await new Promise<BrowserTab[]>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          cleanup();
          reject(new Error("Tab access was not granted. Paste your tabs manually below."));
        }, 2500);

        function cleanup() {
          window.clearTimeout(timeout);
          window.removeEventListener("message", handleMessage);
        }

        function handleMessage(event: MessageEvent<ExtensionTabsResponse>) {
          if (event.source !== window) return;
          const data = event.data;
          if (
            data?.source !== TABZERO_EXTENSION_SOURCE ||
            data.type !== CURRENT_TABS_RESPONSE ||
            data.requestId !== requestId
          ) {
            return;
          }

          cleanup();

          if (!data.ok) {
            reject(new Error(data.error || "Tab access was declined. Paste your tabs manually below."));
            return;
          }

          resolve(data.tabs ?? []);
        }

        window.addEventListener("message", handleMessage);
        window.postMessage(
          {
            source: TABZERO_WEB_SOURCE,
            type: REQUEST_CURRENT_TABS,
            requestId,
          },
          window.location.origin,
        );
      });

      if (tabs.length === 0) {
        setTabImportStatus("manual");
        setTabImportMessage("No http or https tabs were shared. Paste titles or URLs manually below.");
        return;
      }

      setRaw(formatTabsForTextarea(tabs));
      setTabImportStatus("imported");
      setTabImportMessage(
        `Imported ${tabs.length} tab${tabs.length === 1 ? "" : "s"} from this browser window.`,
      );
    } catch (caught) {
      setTabImportStatus("manual");
      setTabImportMessage(
        caught instanceof Error
          ? caught.message
          : "Tab access was not granted. Paste your tabs manually below.",
      );
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const tabs = parseTabsInput(raw);
    if (tabs.length === 0) {
      setError("Add at least one tab — paste a URL or a tab title per line.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze-tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabs, goal, timeRemaining }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create workspace.");
      }
      router.push(`/workspace/${data.workspaceId}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create workspace.",
      );
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/25";

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <div className="animate-fade-up">
          <span className="eyebrow">New workspace</span>
          <h1 className="h-display mt-4 text-4xl font-semibold sm:text-5xl">
            What&apos;s on your screen right now?
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Let TabZero request your current browser tabs, or paste them manually
            if you decline. Only submitted titles and URLs are analyzed.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="glass mt-8 space-y-5 p-6 animate-fade-up [animation-delay:80ms] sm:p-7"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Goal</span>
              <span className="ml-1 text-xs text-muted-foreground">optional</span>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ship the hackathon submission"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Time remaining</span>
              <span className="ml-1 text-xs text-muted-foreground">optional</span>
              <input
                value={timeRemaining}
                onChange={(e) => setTimeRemaining(e.target.value)}
                placeholder="e.g. 90 minutes"
                className={inputClass}
              />
            </label>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Use tabs from this window</p>
                <p
                  className={`mt-1 text-xs ${
                    tabImportStatus === "imported" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tabImportMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={importCurrentTabs}
                disabled={tabImportStatus === "requesting" || loading}
                className="btn-secondary shrink-0 disabled:opacity-60"
              >
                {tabImportStatus === "requesting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Requesting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Get current tabs
                  </>
                )}
              </button>
            </div>
          </section>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your tabs</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${
                  parsedCount > 0
                    ? "bg-primary/15 text-primary ring-primary/25"
                    : "bg-white/5 text-muted-foreground ring-white/10"
                }`}
              >
                {parsedCount} tab{parsedCount === 1 ? "" : "s"} detected
              </span>
            </div>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={10}
              placeholder={`One per line — paste URLs or tab titles:\nhttps://github.com/me/project\nDevpost submission — https://devpost.com/...\nIntro to Transformers (YouTube)\nyoutube.com/watch?v=...`}
              className={`${inputClass} resize-y font-mono leading-6`}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Tip: <code className="rounded bg-white/10 px-1 py-0.5 font-mono">Title — url</code> works too. Lines with
              no URL are treated as tab titles.
            </p>
          </label>

          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  Analyze tabs <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Titles &amp; URLs only — never page contents.
            </span>
          </div>
        </form>
      </section>
    </main>
  );
}
