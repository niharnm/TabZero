"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Boxes,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Lightbulb,
  ListChecks,
  Share2,
  Siren,
  Sparkles,
  Target,
  Timer,
  Trash2,
  XCircle,
} from "lucide-react";
import type { BrowserTab, Task, WorkspaceRecord } from "@/lib/types";
import { cleanDomain, formatTimestamp } from "@/lib/utils";
import { workspaceToMarkdown } from "@/lib/markdown";
import {
  Badge,
  Card,
  SectionTitle,
  Stat,
  actionTone,
  priorityTone,
  urgencyTone,
} from "@/components/ui";

function tabKey(tab: BrowserTab): string {
  return tab.url || `${tab.title}-${tab.id ?? ""}`;
}

function dedupeTabs(tabs: BrowserTab[]): BrowserTab[] {
  const seen = new Set<string>();
  const out: BrowserTab[] = [];
  for (const tab of tabs) {
    const key = tabKey(tab);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tab);
  }
  return out;
}

function removeTabs(tabs: BrowserTab[], blocked: BrowserTab[]): BrowserTab[] {
  const blockedKeys = new Set(blocked.map(tabKey));
  return tabs.filter((tab) => !blockedKeys.has(tabKey(tab)));
}

function tabReceiptLine(tab: BrowserTab): string {
  const domain = cleanDomain(tab.url);
  const label = tab.title || domain || tab.url || "Untitled tab";
  return tab.url ? `- ${label} (${tab.url})` : `- ${label}`;
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeFilename(title: string, suffix: string): string {
  const safe = (title || "tabzero")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${safe || "tabzero"}-${suffix}`;
}

function Favicon({ tab }: { tab: BrowserTab }) {
  const [broken, setBroken] = useState(false);
  const domain = cleanDomain(tab.url);
  const letter = (domain || tab.title || "?").charAt(0).toUpperCase();

  if (tab.favIconUrl && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={tab.favIconUrl}
        alt=""
        width={16}
        height={16}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="h-4 w-4 rounded-sm"
      />
    );
  }
  return (
    <span className="grid h-4 w-4 place-items-center rounded-sm bg-primary/20 text-[9px] font-bold text-primary">
      {letter}
    </span>
  );
}

function TabRow({ tab }: { tab: BrowserTab }) {
  const domain = cleanDomain(tab.url);
  const content = (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-muted/40">
      <Favicon tab={tab} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-foreground">{tab.title || domain || tab.url}</div>
        {domain ? <div className="truncate text-xs text-muted-foreground">{domain}</div> : null}
      </div>
      {tab.url ? <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
    </div>
  );
  if (!tab.url) return content;
  return (
    <a href={tab.url} target="_blank" rel="noreferrer" className="block">
      {content}
    </a>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium transition hover:border-primary/40"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function WorkspaceView({
  workspace,
  readOnly = false,
}: {
  workspace: WorkspaceRecord;
  readOnly?: boolean;
}) {
  const a = workspace.analysis;
  const [tasks, setTasks] = useState<Task[]>(a.nextTasks);
  const [slug, setSlug] = useState<string | undefined>(workspace.shareSlug);
  const [shareLink, setShareLink] = useState<string>("");
  const [sharing, setSharing] = useState(false);

  const distractionCount = useMemo(
    () => a.groups.find((g) => g.name === "Distractions")?.tabs.length ?? 0,
    [a.groups],
  );
  const completedCount = tasks.filter((t) => t.completed).length;
  const triage = useMemo(() => {
    const keep = dedupeTabs([
      ...a.groups.filter((group) => group.action === "keep").flatMap((group) => group.tabs),
      ...a.distractionCleanup.keepPinned,
    ]);
    const save = dedupeTabs([
      ...a.groups.filter((group) => group.action === "save").flatMap((group) => group.tabs),
      ...a.distractionCleanup.saveForLater,
    ]);
    const closeCandidates = dedupeTabs([
      ...a.groups.filter((group) => group.action === "close").flatMap((group) => group.tabs),
      ...(a.groups.find((group) => group.name === "Distractions")?.tabs ?? []),
      ...a.distractionCleanup.closeNow,
    ]);
    const doNow = removeTabs(
      dedupeTabs(
        tasks.flatMap((task) =>
          task.priority === "high" && !/close|distraction/i.test(task.title)
            ? task.relatedTabs
            : [],
        ),
      ),
      closeCandidates,
    );
    const close = removeTabs(closeCandidates, keep);

    return {
      doNow: doNow.length ? doNow : keep.slice(0, 3),
      keep,
      save,
      close,
    };
  }, [a.distractionCleanup.closeNow, a.distractionCleanup.keepPinned, a.distractionCleanup.saveForLater, a.groups, tasks]);
  const [selectedCloseKeys, setSelectedCloseKeys] = useState<Set<string>>(
    () => new Set(triage.close.map(tabKey)),
  );
  const selectedCloseTabs = triage.close.filter((tab) =>
    selectedCloseKeys.has(tabKey(tab)),
  );

  function buildTriageReceipt(closeTabs = selectedCloseTabs): string {
    const lines: string[] = [];
    lines.push(`# TabZero Triage Receipt`);
    lines.push("");
    lines.push(`Workspace: ${workspace.title}`);
    if (a.goal) lines.push(`Goal: ${a.goal}`);
    if (a.timeRemaining) lines.push(`Time remaining: ${a.timeRemaining}`);
    lines.push(`Created: ${formatTimestamp(workspace.createdAt)}`);
    lines.push(`First thing to do: ${a.firstThingToDo}`);
    lines.push("");
    lines.push("## Do Now");
    lines.push(...(triage.doNow.length ? triage.doNow.map(tabReceiptLine) : ["- None"]));
    lines.push("");
    lines.push("## Keep Open");
    lines.push(...(triage.keep.length ? triage.keep.map(tabReceiptLine) : ["- None"]));
    lines.push("");
    lines.push("## Save Later");
    lines.push(...(triage.save.length ? triage.save.map(tabReceiptLine) : ["- None"]));
    lines.push("");
    lines.push("## Safe To Close");
    lines.push(...(closeTabs.length ? closeTabs.map(tabReceiptLine) : ["- None selected"]));
    lines.push("");
    lines.push("Generated by TabZero. Review before closing anything important.");
    lines.push("");
    return lines.join("\n");
  }

  async function toggleTask(task: Task) {
    if (readOnly || !task.id) return;
    const next = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: next } : t)),
    );
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      });
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !next } : t)),
      );
    }
  }

  function exportMarkdown() {
    downloadTextFile(
      safeFilename(workspace.title, "workspace.md"),
      workspaceToMarkdown(workspace),
    );
  }

  function exportTriageReceipt() {
    downloadTextFile(
      safeFilename(workspace.title, "triage-receipt.md"),
      buildTriageReceipt(),
    );
  }

  async function createShare() {
    setSharing(true);
    try {
      const res = await fetch(`/api/workspace/${workspace.id}/share`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSlug(data.slug);
        setShareLink(data.url || `/share/${data.slug}`);
      }
    } finally {
      setSharing(false);
    }
  }

  const resolvedShareUrl = shareLink || (slug ? `/share/${slug}` : "");

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      {/* Header */}
      <div className="flex flex-col gap-5 animate-fade-up sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={urgencyTone(a.urgencyLevel)}>{a.urgencyLevel} urgency</Badge>
            {readOnly ? <Badge tone="violet">Shared · read-only</Badge> : null}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gradient sm:text-4xl">
            {workspace.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {a.goal ? (
              <span className="inline-flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> {a.goal}
              </span>
            ) : null}
            {a.timeRemaining ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {a.timeRemaining}
              </span>
            ) : null}
            <span>Created {formatTimestamp(workspace.createdAt)}</span>
          </div>
        </div>

        {!readOnly ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              onClick={exportMarkdown}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3.5 py-2 text-sm font-medium transition hover:border-primary/40"
            >
              <Download className="h-4 w-4" /> Export Markdown
            </button>
            <button
              onClick={createShare}
              disabled={sharing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" /> {slug ? "Share link" : sharing ? "Creating…" : "Share"}
            </button>
          </div>
        ) : (
          <button
            onClick={exportMarkdown}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3.5 py-2 text-sm font-medium transition hover:border-primary/40"
          >
            <Download className="h-4 w-4" /> Export Markdown
          </button>
        )}
      </div>

      {/* Share link surfaced */}
      {!readOnly && resolvedShareUrl ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm animate-fade-up">
          <Share2 className="h-4 w-4 text-primary" />
          <a href={resolvedShareUrl} className="truncate text-primary underline-offset-2 hover:underline">
            {resolvedShareUrl}
          </a>
          <span className="ml-auto">
            <CopyButton text={resolvedShareUrl} label="Copy link" />
          </span>
        </div>
      ) : null}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 animate-fade-up sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Tabs" value={a.totalTabs} />
        <Stat label="Groups" value={a.groups.length} />
        <Stat label="Distractions" value={distractionCount} />
        <Stat label="Focus time" value={`${a.estimatedFocusMinutes}m`} />
        <Stat label="Tasks done" value={`${completedCount}/${tasks.length}`} />
      </div>

      <TriageCockpit
        doNow={triage.doNow}
        keep={triage.keep}
        save={triage.save}
        close={triage.close}
        selectedCloseKeys={selectedCloseKeys}
        selectedCloseTabs={selectedCloseTabs}
        onToggleClose={(tab) => {
          const key = tabKey(tab);
          setSelectedCloseKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          });
        }}
        onSelectAllClose={() =>
          setSelectedCloseKeys(new Set(triage.close.map(tabKey)))
        }
        onClearClose={() => setSelectedCloseKeys(new Set())}
        receiptText={buildTriageReceipt()}
        onDownloadReceipt={exportTriageReceipt}
      />

      {/* Summary */}
      <div className="mt-6 grid gap-4 animate-fade-up lg:grid-cols-2">
        <Card>
          <SectionTitle icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}>
            What&apos;s going on
          </SectionTitle>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{a.mainProblem}</p>
          <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-amber-300">Risk</div>
            <p className="mt-1 text-sm text-amber-100/90">{a.riskWarning}</p>
          </div>
        </Card>
        <Card>
          <SectionTitle icon={<Lightbulb className="h-4 w-4 text-primary" />}>
            What to do
          </SectionTitle>
          <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-primary">First thing to do</div>
            <p className="mt-1 text-sm text-foreground">{a.firstThingToDo}</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{a.focusRecommendation}</p>
        </Card>
      </div>

      {/* Grouped tabs */}
      <div className="mt-10">
        <SectionTitle icon={<Boxes className="h-5 w-5 text-primary" />} count={a.groups.length}>
          Grouped tabs
        </SectionTitle>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {a.groups.map((group) => (
            <Card key={group.name}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold tracking-tight">{group.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{group.explanation}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge tone={actionTone(group.action)}>{group.action}</Badge>
                  <Badge tone={priorityTone(group.priority)}>{group.priority}</Badge>
                </div>
              </div>
              <div className="mt-3 space-y-0.5">
                {group.tabs.map((tab, i) => (
                  <TabRow key={`${group.name}-${i}`} tab={tab} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Action plan */}
      <div className="mt-10">
        <SectionTitle icon={<ListChecks className="h-5 w-5 text-primary" />} count={tasks.length}>
          Action plan
        </SectionTitle>
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <Card key={task.id ?? task.title} className={task.completed ? "opacity-60" : ""}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTask(task)}
                  disabled={readOnly}
                  aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                  className={[
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
                    task.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-border bg-muted/30 hover:border-primary/50",
                    readOnly ? "cursor-default" : "cursor-pointer",
                  ].join(" ")}
                >
                  {task.completed ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`font-medium ${task.completed ? "line-through" : ""}`}>{task.title}</h3>
                    <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                    <Badge tone="neutral">
                      <Timer className="h-3 w-3" /> {task.estimatedMinutes}m
                    </Badge>
                  </div>
                  {task.whyItMatters ? (
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{task.whyItMatters}</p>
                  ) : null}
                  {task.relatedTabs.length ? (
                    <div className="mt-2 space-y-0.5">
                      {task.relatedTabs.map((tab, i) => (
                        <TabRow key={`${task.id}-rel-${i}`} tab={tab} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Panic Mode */}
      {a.panicMode ? (
        <div className="mt-10">
          <SectionTitle icon={<Siren className="h-5 w-5 text-red-400" />}>Panic Mode</SectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            You said time is limited — here&apos;s the blunt version.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <PanicList title="Do now" tone="green" items={a.panicMode.doNow} />
            <PanicList title="Cut" tone="amber" items={a.panicMode.cut} />
            <PanicList title="Ignore" tone="red" items={a.panicMode.ignore} />
            <PanicList title="Final sprint plan" tone="violet" items={a.panicMode.finalSprintPlan} />
            <PanicList
              title="Minimum viable submission"
              tone="blue"
              items={a.panicMode.minimumViableSubmission}
              className="lg:col-span-2"
            />
          </div>
        </div>
      ) : null}

      {/* Focus session */}
      <div className="mt-10">
        <SectionTitle icon={<Timer className="h-5 w-5 text-primary" />} count={a.focusSession.length}>
          Focus session
        </SectionTitle>
        <div className="mt-4 space-y-2">
          {a.focusSession.map((block, i) => (
            <div key={i} className="glass flex items-center gap-4 p-4">
              <div className="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <div className="text-base font-semibold leading-none">{block.minutes}</div>
                <div className="text-[10px] uppercase tracking-wide">min</div>
              </div>
              <div className="min-w-0">
                <div className="font-medium">{block.label}</div>
                <div className="text-sm text-muted-foreground">{block.instructions}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distraction cleanup */}
      <div className="mt-10">
        <SectionTitle icon={<Trash2 className="h-5 w-5 text-primary" />}>Distraction cleanup</SectionTitle>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <CleanupColumn title="Close now" tone="red" tabs={a.distractionCleanup.closeNow} />
          <CleanupColumn title="Save for later" tone="blue" tabs={a.distractionCleanup.saveForLater} />
          <CleanupColumn title="Keep pinned" tone="green" tabs={a.distractionCleanup.keepPinned} />
        </div>
      </div>

      {/* Reasoning + teammate message */}
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={<Sparkles className="h-4 w-4 text-primary" />}>How TabZero reasoned</SectionTitle>
          <ul className="mt-3 space-y-2">
            {a.aiReasoning.map((line, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <SectionTitle>Message for teammates</SectionTitle>
            <CopyButton text={a.teammateMessage} />
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {a.teammateMessage}
          </p>
        </Card>
      </div>
    </section>
  );
}

function TriageCockpit({
  doNow,
  keep,
  save,
  close,
  selectedCloseKeys,
  selectedCloseTabs,
  onToggleClose,
  onSelectAllClose,
  onClearClose,
  receiptText,
  onDownloadReceipt,
}: {
  doNow: BrowserTab[];
  keep: BrowserTab[];
  save: BrowserTab[];
  close: BrowserTab[];
  selectedCloseKeys: Set<string>;
  selectedCloseTabs: BrowserTab[];
  onToggleClose: (tab: BrowserTab) => void;
  onSelectAllClose: () => void;
  onClearClose: () => void;
  receiptText: string;
  onDownloadReceipt: () => void;
}) {
  const selectedCloseUrls = selectedCloseTabs
    .map((tab) => tab.url)
    .filter(Boolean)
    .join("\n");

  return (
    <section className="mt-8 animate-fade-up">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionTitle icon={<Target className="h-5 w-5 text-primary" />}>
            Deadline triage
          </SectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the smallest set of tabs now, park the rest, and close only what
            you can recover from the receipt.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={receiptText} label="Copy receipt" />
          <button
            onClick={onDownloadReceipt}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium transition hover:border-primary/40"
          >
            <Download className="h-3.5 w-3.5" />
            Download receipt
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <TriageColumn
          title="Do now"
          hint="Open these first."
          tone="green"
          icon={<ListChecks className="h-4 w-4" />}
          tabs={doNow}
        />
        <TriageColumn
          title="Keep open"
          hint="Useful context for the current goal."
          tone="violet"
          icon={<Check className="h-4 w-4" />}
          tabs={keep}
        />
        <TriageColumn
          title="Save later"
          hint="Worth keeping, not worth attention now."
          tone="blue"
          icon={<Archive className="h-4 w-4" />}
          tabs={save}
        />
        <div className="glass p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge tone="red">
                <XCircle className="h-3.5 w-3.5" />
                Safe to close
              </Badge>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Select what you are comfortable closing after saving the receipt.
              </p>
            </div>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-inset ring-white/10">
              {selectedCloseTabs.length}/{close.length}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onSelectAllClose}
              className="rounded-md border border-border bg-muted/30 px-2 py-1 text-xs transition hover:border-primary/40"
            >
              Select all
            </button>
            <button
              onClick={onClearClose}
              className="rounded-md border border-border bg-muted/30 px-2 py-1 text-xs transition hover:border-primary/40"
            >
              Clear
            </button>
            <CopyButton
              text={selectedCloseUrls || "No close tabs selected."}
              label="Copy URLs"
            />
          </div>
          <div className="mt-3 max-h-72 space-y-1 overflow-auto pr-1">
            {close.length === 0 ? (
              <p className="rounded-lg bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
                Nothing looks safe to close yet.
              </p>
            ) : (
              close.map((tab) => (
                <TriageSelectableTab
                  key={tabKey(tab)}
                  tab={tab}
                  checked={selectedCloseKeys.has(tabKey(tab))}
                  onChange={() => onToggleClose(tab)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TriageColumn({
  title,
  hint,
  tone,
  icon,
  tabs,
}: {
  title: string;
  hint: string;
  tone: Parameters<typeof Badge>[0]["tone"];
  icon: React.ReactNode;
  tabs: BrowserTab[];
}) {
  return (
    <div className="glass p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone={tone}>
            {icon}
            {title}
          </Badge>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-inset ring-white/10">
          {tabs.length}
        </span>
      </div>
      <div className="mt-3 max-h-72 space-y-1 overflow-auto pr-1">
        {tabs.length === 0 ? (
          <p className="rounded-lg bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
            Nothing here.
          </p>
        ) : (
          tabs.map((tab) => <TabRow key={tabKey(tab)} tab={tab} />)
        )}
      </div>
    </div>
  );
}

function TriageSelectableTab({
  tab,
  checked,
  onChange,
}: {
  tab: BrowserTab;
  checked: boolean;
  onChange: () => void;
}) {
  const domain = cleanDomain(tab.url);
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-muted/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border bg-muted accent-red-400"
      />
      <Favicon tab={tab} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">
          {tab.title || domain || tab.url}
        </span>
        {domain ? (
          <span className="block truncate text-xs text-muted-foreground">
            {domain}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function PanicList({
  title,
  items,
  tone,
  className,
}: {
  title: string;
  items: string[];
  tone: Parameters<typeof Badge>[0]["tone"];
  className?: string;
}) {
  return (
    <Card className={className}>
      <Badge tone={tone}>{title}</Badge>
      <ul className="mt-3 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">—</li>
        ) : (
          items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
              <span>{item}</span>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

function CleanupColumn({
  title,
  tabs,
  tone,
}: {
  title: string;
  tabs: BrowserTab[];
  tone: Parameters<typeof Badge>[0]["tone"];
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <Badge tone={tone}>{title}</Badge>
        <span className="text-xs text-muted-foreground">{tabs.length}</span>
      </div>
      <div className="mt-3 space-y-0.5">
        {tabs.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">Nothing here.</p>
        ) : (
          tabs.map((tab, i) => <TabRow key={`${title}-${i}`} tab={tab} />)
        )}
      </div>
    </Card>
  );
}
