import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import type { Analysis, BrowserTab, Task, WorkspaceRecord } from "@/lib/types";
import { generateId, generateSlug } from "@/lib/utils";
import { getSupabaseServer, hasSupabase } from "@/lib/supabase";

// Storage supports Supabase when env vars exist, and otherwise falls back to a
// local JSON file (persists across dev restarts; on Vercel it uses the per-instance
// /tmp dir, exactly as the "in-memory / fallback storage" requirement intends).

export type CreateWorkspaceInput = {
  rawTabs: BrowserTab[];
  analysis: Analysis;
};

export function storageBackend(): "supabase" | "file" {
  return hasSupabase() ? "supabase" : "file";
}

// Give every task a stable id so it can be toggled later.
function withTaskIds(analysis: Analysis): Analysis {
  return {
    ...analysis,
    nextTasks: analysis.nextTasks.map((t) => ({
      ...t,
      id: t.id ?? generateId(),
      completed: t.completed ?? false,
    })),
  };
}

// ---------------------------------------------------------------------------
// File-backed fallback store
// ---------------------------------------------------------------------------

const fallbackFile = process.env.VERCEL
  ? join(tmpdir(), "tabzero-workspaces.json")
  : join(process.cwd(), ".tabzero-data", "workspaces.json");

type FallbackStore = {
  workspaces: Record<string, WorkspaceRecord>;
  shares: Record<string, string>; // slug -> id
};

// Cached on globalThis so concurrent requests in one process share state.
const g = globalThis as unknown as { __tabzeroStore?: FallbackStore };

function memory(): FallbackStore {
  if (!g.__tabzeroStore) {
    g.__tabzeroStore = { workspaces: {}, shares: {} };
  }
  return g.__tabzeroStore;
}

async function loadFromDisk(): Promise<void> {
  try {
    const raw = await readFile(fallbackFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<FallbackStore>;
    const store = memory();
    for (const ws of Object.values(parsed.workspaces ?? {})) {
      store.workspaces[ws.id] = ws;
      if (ws.shareSlug) store.shares[ws.shareSlug] = ws.id;
    }
    for (const [slug, id] of Object.entries(parsed.shares ?? {})) {
      store.shares[slug] = id;
    }
  } catch {
    // No file yet — that's fine.
  }
}

async function flushToDisk(): Promise<void> {
  const store = memory();
  try {
    await mkdir(dirname(fallbackFile), { recursive: true });
    await writeFile(fallbackFile, JSON.stringify(store), "utf8");
  } catch (err) {
    console.warn("[tabzero] could not persist fallback store:", err);
  }
}

// ---------------------------------------------------------------------------
// Public API — branches on whether Supabase is configured.
// ---------------------------------------------------------------------------

export async function createWorkspace(
  input: CreateWorkspaceInput,
): Promise<WorkspaceRecord> {
  const analysis = withTaskIds(input.analysis);
  const now = new Date().toISOString();

  if (hasSupabase()) {
    const supabase = getSupabaseServer()!;
    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        title: analysis.title,
        goal: analysis.goal ?? null,
        time_remaining: analysis.timeRemaining ?? null,
        raw_tabs: input.rawTabs,
        analysis,
      })
      .select()
      .single();

    if (!error && data) {
      const record = rowToRecord(data);
      // Mirror tasks into the relational table (best-effort).
      await mirrorTasks(record.id, analysis.nextTasks);
      return record;
    }
    console.warn("[tabzero] Supabase insert failed; using file fallback:", error?.message);
  }

  // File fallback.
  await loadFromDisk();
  const record: WorkspaceRecord = {
    id: generateId(),
    title: analysis.title,
    goal: analysis.goal,
    timeRemaining: analysis.timeRemaining,
    createdAt: now,
    updatedAt: now,
    rawTabs: input.rawTabs,
    analysis,
  };
  memory().workspaces[record.id] = record;
  await flushToDisk();
  return record;
}

export async function getWorkspace(id: string): Promise<WorkspaceRecord | null> {
  if (hasSupabase()) {
    const supabase = getSupabaseServer()!;
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return rowToRecord(data);
  }
  await loadFromDisk();
  return memory().workspaces[id] ?? null;
}

export async function getWorkspaceBySlug(
  slug: string,
): Promise<WorkspaceRecord | null> {
  if (hasSupabase()) {
    const supabase = getSupabaseServer()!;
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("share_slug", slug)
      .maybeSingle();
    if (!error && data) return rowToRecord(data);
  }
  await loadFromDisk();
  const store = memory();
  const id = store.shares[slug];
  return id ? store.workspaces[id] ?? null : null;
}

export async function ensureShareSlug(id: string): Promise<string | null> {
  if (hasSupabase()) {
    const supabase = getSupabaseServer()!;
    const existing = await getWorkspace(id);
    if (!existing) return null;
    if (existing.shareSlug) return existing.shareSlug;

    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = generateSlug();
      const { data, error } = await supabase
        .from("workspaces")
        .update({ share_slug: slug })
        .eq("id", id)
        .is("share_slug", null)
        .select()
        .maybeSingle();
      if (!error && data) return slug;
      const refreshed = await getWorkspace(id);
      if (refreshed?.shareSlug) return refreshed.shareSlug;
    }
    return null;
  }

  await loadFromDisk();
  const store = memory();
  const record = store.workspaces[id];
  if (!record) return null;
  if (record.shareSlug) return record.shareSlug;

  let slug = generateSlug();
  while (store.shares[slug]) slug = generateSlug();
  record.shareSlug = slug;
  record.updatedAt = new Date().toISOString();
  store.shares[slug] = id;
  await flushToDisk();
  return slug;
}

export async function toggleTask(
  taskId: string,
  completed: boolean,
): Promise<{ workspaceId: string; task: Task } | null> {
  if (hasSupabase()) {
    const supabase = getSupabaseServer()!;
    const { data: taskRow } = await supabase
      .from("workspace_tasks")
      .select("workspace_id")
      .eq("id", taskId)
      .maybeSingle();
    const workspaceId = taskRow?.workspace_id as string | undefined;
    if (!workspaceId) return null;

    await supabase.from("workspace_tasks").update({ completed }).eq("id", taskId);

    const record = await getWorkspace(workspaceId);
    if (!record) return null;
    let updated: Task | null = null;
    const nextTasks = record.analysis.nextTasks.map((t) => {
      if (t.id === taskId) {
        updated = { ...t, completed };
        return updated;
      }
      return t;
    });
    if (!updated) return null;
    await supabase
      .from("workspaces")
      .update({ analysis: { ...record.analysis, nextTasks } })
      .eq("id", workspaceId);
    return { workspaceId, task: updated };
  }

  await loadFromDisk();
  const store = memory();
  for (const record of Object.values(store.workspaces)) {
    const task = record.analysis.nextTasks.find((t) => t.id === taskId);
    if (task) {
      task.completed = completed;
      record.updatedAt = new Date().toISOString();
      await flushToDisk();
      return { workspaceId: record.id, task };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Supabase row mapping
// ---------------------------------------------------------------------------

type WorkspaceRow = {
  id: string;
  title: string;
  goal: string | null;
  time_remaining: string | null;
  created_at: string;
  raw_tabs: BrowserTab[] | null;
  analysis: Analysis;
  share_slug: string | null;
};

function rowToRecord(row: WorkspaceRow): WorkspaceRecord {
  return {
    id: row.id,
    title: row.title,
    goal: row.goal ?? undefined,
    timeRemaining: row.time_remaining ?? undefined,
    createdAt: row.created_at,
    rawTabs: row.raw_tabs ?? [],
    analysis: row.analysis,
    shareSlug: row.share_slug ?? undefined,
  };
}

async function mirrorTasks(workspaceId: string, tasks: Task[]): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase || tasks.length === 0) return;
  const rows = tasks.map((t) => ({
    id: t.id,
    workspace_id: workspaceId,
    title: t.title,
    why_it_matters: t.whyItMatters ?? null,
    estimated_minutes: t.estimatedMinutes ?? null,
    priority: t.priority ?? null,
    completed: t.completed ?? false,
    related_tabs: t.relatedTabs ?? [],
  }));
  const { error } = await supabase.from("workspace_tasks").insert(rows);
  if (error) {
    console.warn("[tabzero] workspace_tasks mirror failed:", error.message);
  }
}
