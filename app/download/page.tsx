import Link from "next/link";
import {
  ArrowRight,
  Chrome,
  Apple,
  Check,
  Puzzle,
  Keyboard,
  ShieldCheck,
  Download,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Reveal } from "@/components/Reveal";

export const metadata = {
  title: "Download TabZero — Chrome extension or macOS app",
  description:
    "Get TabZero as a Chrome extension or a native macOS app. Both turn your open tabs into an organized workspace.",
};

const REPO = "https://github.com/niharnm/TabZero";

export default function DownloadPage() {
  const chromeUrl = process.env.NEXT_PUBLIC_CHROME_WEBSTORE_URL || "#chrome-setup";
  const macUrl =
    process.env.NEXT_PUBLIC_MACOS_DOWNLOAD_URL || `${REPO}/releases/latest`;
  const hasStore = Boolean(process.env.NEXT_PUBLIC_CHROME_WEBSTORE_URL);

  return (
    <main>
      <Header />

      <section className="relative overflow-hidden px-5 pb-10 pt-20 text-center sm:pt-28">
        <div className="aurora" aria-hidden />
        <div className="aurora-veil" aria-hidden />
        <div className="mx-auto max-w-3xl animate-fade-up">
          <span className="eyebrow">Download</span>
          <h1 className="h-serif mx-auto mt-5 max-w-2xl text-5xl text-white sm:text-6xl">
            Run TabZero your way
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/65">
            Two ways to get TabZero. Both send only tab titles and URLs — never
            page contents.
          </p>
        </div>
      </section>

      {/* Two options */}
      <section className="mx-auto max-w-5xl px-5 pb-10">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Chrome */}
          <Reveal delay={1}>
            <div className="feature-card flex h-full flex-col p-7">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10">
                  <Chrome className="h-6 w-6 text-primary" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Chrome extension</h2>
                  <p className="text-xs text-muted-foreground">Chrome, Edge, Brave & Chromium</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Send the tabs in your current window to TabZero in one click — no
                copy-paste. The fastest way if you live in the browser.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {["One-click tab capture", "Set a goal & time in the popup", "Opens your workspace instantly"].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-400" /> {t}
                    </li>
                  ),
                )}
              </ul>
              <div className="mt-auto pt-6">
                <a href={chromeUrl} className="btn-primary w-full">
                  <Puzzle className="h-4 w-4" /> {hasStore ? "Add to Chrome" : "Get the extension"}
                  <ArrowRight className="h-4 w-4" />
                </a>
                {!hasStore ? (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Pre-release — load it unpacked in seconds (steps below).
                  </p>
                ) : null}
              </div>
            </div>
          </Reveal>

          {/* macOS */}
          <Reveal delay={2}>
            <div className="feature-card feature-card--accent flex h-full flex-col p-7">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/15">
                  <Apple className="h-6 w-6 text-white" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-white">macOS app</h2>
                  <p className="text-xs text-white/55">Apple Silicon & Intel · macOS 12+</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/70">
                A dedicated TabZero window that lives in your menu bar, with a
                global hotkey to jump straight into a new workspace.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {[
                  ["Native window & menu-bar icon", <ShieldCheck key="a" className="h-4 w-4 text-emerald-300" />],
                  ["Global ⌘⏎ to start a workspace", <Keyboard key="b" className="h-4 w-4 text-emerald-300" />],
                  ["Same dashboard, no browser needed", <Check key="c" className="h-4 w-4 text-emerald-300" />],
                ].map(([t, icon]) => (
                  <li key={t as string} className="flex items-center gap-2 text-white/75">
                    {icon} {t}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <a href={macUrl} className="btn-primary w-full">
                  <Download className="h-4 w-4" /> Download for macOS
                  <ArrowRight className="h-4 w-4" />
                </a>
                <p className="mt-2 text-center text-xs text-white/55">
                  Universal .dmg from the latest release.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Chrome setup steps (shown until a Web Store listing exists) */}
      <section id="chrome-setup" className="mx-auto max-w-5xl px-5 py-12">
        <Reveal>
          <span className="eyebrow">Chrome — load unpacked</span>
          <h2 className="h-display mt-3 text-3xl font-semibold sm:text-4xl">Up and running in a minute</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["01", "Build it", "Clone the repo, then run npm install and npm run build inside extension/."],
            ["02", "Open extensions", "Go to chrome://extensions and turn on Developer mode."],
            ["03", "Load unpacked", "Click Load unpacked and select extension/dist."],
            ["04", "Pin & use", "Open the TabZero popup, set your goal, and send your tabs."],
          ].map(([n, t, b]) => (
            <Reveal key={n} delay={((Number(n) % 3) + 1) as 1 | 2 | 3}>
              <div className="surface h-full p-5">
                <span className="font-serif text-2xl text-primary">{n}</span>
                <h3 className="mt-2 font-semibold tracking-tight">{t}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{b}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Prefer the source?{" "}
          <a href={REPO} className="text-primary underline-offset-2 hover:underline">
            niharnm/TabZero
          </a>{" "}
          has both the extension and the macOS app.
        </p>
      </section>

      {/* No-download path */}
      <section className="mx-auto max-w-5xl px-5 pb-24">
        <Reveal>
          <div className="surface flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">No download needed</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You can also paste your tabs straight into the web app.
              </p>
            </div>
            <Link href="/new" className="btn-secondary shrink-0">
              Open the web app <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
