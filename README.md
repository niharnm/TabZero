# TabZero

TabZero turns messy browser tabs into organized **workspaces, priorities, and a timed focus plan** using AI (OpenAI or Gemini) or a deterministic local analyzer. It is a hosted Next.js dashboard that pairs with a Chrome extension.

TabZero only ever analyzes **tab titles and URLs** — never the contents of your pages.

The **Next.js web app is the repository root** so Vercel auto-detects and deploys
only the website. The Chrome extension is bundled alongside it and is excluded
from the deployment.

```
TabZero/            # repo root = the Next.js web app (deployed to Vercel)
  app/              # App Router pages + API routes
  components/
  lib/
  extension/        # Chrome extension (not part of the web deploy)
  desktop/          # Tauri native app — macOS .dmg (not part of the web deploy)
  .github/          # CI: builds the macOS .dmg + extension .zip on a release tag
  vercel.json       # framework: nextjs
  .vercelignore     # excludes extension/, desktop/, .github/ from deploys
  README.md
```

TabZero ships in two installable forms (see the `/download` page): a **Chrome
extension** and a **native macOS app**.

## How it works

1. You provide tabs — from the Chrome extension (one click) or by pasting them at `/new`.
2. `POST /api/analyze-tabs` groups the tabs, builds tasks, a focus session, Panic Mode, and a distraction-cleanup plan, and stores a workspace.
3. You land on `/workspace/[id]` with the full plan, can export it as Markdown, and can publish a read-only share link at `/share/[slug]`.

### Provider selection (automatic)

| Condition | Analyzer used |
| --- | --- |
| `OPENAI_API_KEY` is set | OpenAI |
| only `GEMINI_API_KEY` is set | Gemini |
| no AI key | deterministic mock analyzer |

The mock analyzer is **not demo data** — it categorizes the exact tabs you submit using domain/title heuristics. If an AI call fails, TabZero falls back to the mock analyzer automatically. AI requests only ever send tab titles, URLs, your goal, and time remaining.

### Storage selection (automatic)

| Condition | Storage |
| --- | --- |
| Supabase env vars set | Supabase (Postgres) |
| Supabase env vars missing | Local JSON file fallback (`.tabzero-data/` locally, `/tmp` on Vercel) |

The file fallback requires no database. On serverless hosts it is per-instance, so configure Supabase for durable, shareable hosted storage.

## Run the web app locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app works immediately with **no AI key and no database**.

Useful scripts:

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Environment variables

Create `.env.local` as needed (all optional):

```bash
# Public base URL of the deployed app (used to build absolute share links).
NEXT_PUBLIC_APP_URL=

# Supabase (optional). Omit to use the local file fallback.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI providers (optional). Priority: OpenAI > Gemini > mock analyzer.
OPENAI_API_KEY=
GEMINI_API_KEY=
```

Optional model overrides: `OPENAI_MODEL` (default `gpt-4o-mini`), `GEMINI_MODEL` (default `gemini-1.5-flash`). `NEXT_PUBLIC_EXTENSION_URL` can point the landing page's "Install Extension" button at a published listing.

## Supabase schema

Run this SQL in the Supabase SQL editor (or via the CLI) to enable persistent storage:

```sql
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  goal text,
  time_remaining text,
  created_at timestamp with time zone default now(),
  raw_tabs jsonb not null,
  analysis jsonb not null,
  share_slug text unique
);

create table workspace_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  title text not null,
  why_it_matters text,
  estimated_minutes int,
  priority text,
  completed boolean default false,
  related_tabs jsonb,
  created_at timestamp with time zone default now()
);
```

TabZero writes to `workspaces` (the canonical record, including the full analysis JSON) and mirrors tasks into `workspace_tasks`. Server writes use `SUPABASE_SERVICE_ROLE_KEY`; if you only set the anon key, add row-level security policies that permit the operations you need.

### Row-level security (recommended)

The server uses the service-role key (which bypasses RLS) and scopes every query
by `user_id`, but enabling RLS is good defense-in-depth:

```sql
alter table workspaces enable row level security;
alter table workspace_tasks enable row level security;

-- Owners can read/write their own workspaces.
create policy "own workspaces" on workspaces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Anyone can read a workspace that has been shared.
create policy "public shares" on workspaces
  for select using (share_slug is not null);
```

## Accounts & authentication

TabZero uses **Supabase Auth**. Behavior depends on configuration:

| Supabase configured? | Auth |
| --- | --- |
| Yes (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | **Sign-in required** — `/new`, `/dashboard`, and `/workspace/[id]` are gated; share links stay public. Workspaces are saved to the user's account and listed at `/dashboard`. |
| No | **Anonymous** — the app works with no login, using file-based storage. |

Sign-in methods: **Google** and **email + password**. To enable them:

1. In Supabase → **Authentication → Providers**, enable **Email** and **Google** (add your Google OAuth client ID/secret).
2. In Supabase → **Authentication → URL Configuration**, set the **Site URL** to your deployed URL and add redirect URLs:
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`
3. Set `NEXT_PUBLIC_APP_URL` to your deployed URL.

No extra app env vars are needed — auth uses the same `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The macOS app (which loads the web dashboard) inherits the web session; the Chrome extension uses the public API and can be wired to send a Supabase access token in a follow-up.

## Deploy to Vercel

Because the Next.js app is the repository root, Vercel detects it automatically —
**no Root Directory change is needed**. The bundled `extension/` folder is ignored
via `.vercelignore`, so only the website is deployed.

1. Import `niharnm/TabZero` into Vercel. It auto-detects **Next.js** (root directory `./`).
2. Add environment variables (all optional). Set `NEXT_PUBLIC_APP_URL` to the deployed URL so share links are absolute.
3. Deploy.

The app deploys and runs without any environment variables — AI and Supabase simply light up when their keys are present.

## API surface

All routes return JSON and send permissive CORS headers so the Chrome extension can call them cross-origin.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/analyze-tabs` | Analyze tabs, store a workspace, return the full `AnalyzeTabsResponse` (`workspaceId` + analysis). |
| `GET` | `/api/workspace/[id]` | Fetch a workspace. Add `?format=md` to download Markdown. |
| `PATCH` | `/api/tasks/[id]` | Toggle a task's `completed` state. |
| `POST` | `/api/workspace/[id]/share` | Create/return a share slug; responds with `{ slug, url }`. |
| `GET` | `/api/share/[slug]` | Fetch a public, read-only workspace by slug. |

`POST /api/analyze-tabs` body:

```ts
type BrowserTab = { id?: number; title: string; url: string; active: boolean; favIconUrl?: string };
type AnalyzeTabsRequest = { tabs: BrowserTab[]; goal?: string; timeRemaining?: string };
```

## Chrome extension

The web API is stable and CORS-enabled, so the extension only needs to POST tabs and open the returned workspace. To wire it up:

1. Build the extension with the web app URL injected:
   ```bash
   cd extension
   npm install
   # PowerShell:
   $env:VITE_WEB_APP_URL="https://your-project.vercel.app"   # or http://localhost:3000
   npm run build
   ```
2. Collect the current window's tabs (`chrome.tabs.query`) as `BrowserTab[]` — titles and URLs only.
3. `POST` them to `${VITE_WEB_APP_URL}/api/analyze-tabs` with the optional `goal` and `timeRemaining`.
4. Read `workspaceId` from the response and open `${VITE_WEB_APP_URL}/workspace/${workspaceId}` in a new tab.
5. Load the unpacked build for testing: `chrome://extensions` → Developer Mode → **Load unpacked** → select `extension/dist`.

Keep the manifest host permissions aligned with the deployed API origin (e.g. `https://*.vercel.app/*` and `http://localhost:3000/*`).

## macOS desktop app

The `desktop/` folder is a [Tauri v2](https://tauri.app) shell that opens the
TabZero dashboard in a native macOS window with a menu-bar icon. It points at the
deployed web app, so the dashboard UI is identical to the website.

**Releases are built in CI** (a macOS runner — a `.dmg` cannot be compiled on
Windows/Linux). To cut a release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

`.github/workflows/release.yml` then:

1. generates app icons, injects your deployed URL (repo variable `TABZERO_APP_URL`, default `https://tabzero.app`),
2. builds the universal macOS `.dmg`,
3. builds the extension and zips it,
4. publishes both to a GitHub Release.

The `/download` page's "Download for macOS" button links to
`releases/latest` (override with `NEXT_PUBLIC_MACOS_DOWNLOAD_URL`). The build is
**unsigned** by default — first launch is right-click → **Open**. To sign &
notarize, add Apple Developer secrets and the corresponding `tauri-action` env
vars.

Build locally on a Mac with Rust + Node installed:

```bash
cd desktop
npm install
npm run tauri icon icon-source.png   # generate icons from a 1024px source
npm run tauri build
```

## Privacy

TabZero only analyzes tab **titles and URLs**. It never reads page contents, and AI requests contain only titles, URLs, your goal, and time remaining.
