"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { Header } from "@/components/Header";
import { parseTabsInput } from "@/lib/utils";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const parsedCount = useMemo(() => parseTabsInput(raw).length, [raw]);

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
            Paste your open tabs and TabZero turns them into groups, priorities,
            and a focus plan. Only the titles and URLs you enter are analyzed.
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
