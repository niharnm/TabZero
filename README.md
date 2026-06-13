# BurnoutCheck — Chrome Extension (Manifest V3)

A privacy-first burnout detector. It reads tab-behavior patterns — counts, URLs,
titles, and timing — and scores your stress in real time. **It never reads page
content.**

## Load it

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. The badge appears immediately (works offline via a local fallback scorer)

## The only two strings to replace

Set your Supabase project in **`supabase.js`**:

```js
export const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
export const SUPABASE_KEY = "YOUR_ANON_KEY";
```

`background.js` imports both from `supabase.js`, so you only edit them in one
place. Until you set them (or if Supabase is unreachable), the extension scores
locally and stays fully functional.

Expected Supabase backend:
- Edge Function: `POST {SUPABASE_URL}/functions/v1/score`
- Table (raw signals): `browser_readings` at `/rest/v1/browser_readings`
- Score response shape:
  ```json
  { "score": 72, "status": "red",
    "triggers": ["34 tabs open", "switching every 8s"],
    "intervention": "You're not working, you're spiraling. Pick one tab." }
  ```

## Icons

`icons/icon16.png`, `icon48.png`, `icon128.png` are generated placeholders
(solid brand-red with a white dot). Replace them with real artwork at the same
sizes and filenames — no manifest changes needed.

## Files

| File | Role |
|------|------|
| `manifest.json` | MV3 manifest, permissions, registrations |
| `background.js` | Service worker: signal collection, scoring, badge, notifications |
| `supabase.js` | Shared fetch helpers + the two config constants |
| `content.js` | Frustration signal (rapid-backspace count only) |
| `popup.html/.css/.js` | Score ring, stats, triggers, actions, sparkline |
| `reset.html` | Standalone 3-minute breathing reset |
