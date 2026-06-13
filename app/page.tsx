import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Boxes,
  ListChecks,
  Siren,
  Timer,
  Trash2,
  ShieldCheck,
  Wand2,
  Download,
  Archive,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ProductMock } from "@/components/ProductMock";
import { Reveal } from "@/components/Reveal";
import { GroupsDemo, TasksDemo, PanicDemo, FocusDemo } from "@/components/FeatureDemos";

const SMALL_FEATURES = [
  {
    icon: Archive,
    title: "Close safely, reopen anytime",
    body: "Your tabs live in a restorable workspace. Close them in your browser and bring any group back with one click.",
  },
  {
    icon: Trash2,
    title: "Distraction cleanup",
    body: "A clear split of what to close now, save for later, and keep pinned — duplicates flagged automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Only tab titles and URLs are analyzed. Page contents never leave your browser.",
  },
  {
    icon: Wand2,
    title: "AI optional",
    body: "OpenAI or Gemini when you add a key, and a sharp deterministic analyzer when you don't.",
  },
];

const STEPS = [
  ["01", "Send your tabs", "One click from the Chrome extension, or paste URLs and titles at /new."],
  ["02", "TabZero analyzes", "Tabs are grouped and ranked, with tasks, a focus plan, and a cleanup list."],
  ["03", "Work the plan", "Follow the first move, check off tasks, export, or share a read-only link."],
];

function BigFeature({
  accent = false,
  icon,
  eyebrow,
  title,
  body,
  children,
}: {
  accent?: boolean;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className={`feature-card ${accent ? "feature-card--accent" : ""} p-6 sm:p-7`}>
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="eyebrow !text-primary">{eyebrow}</span>
      </div>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-white/65">{body}</p>
      <div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/20 p-4">{children}</div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-16 pt-24 text-center sm:pt-32">
        <div className="aurora" aria-hidden />
        <div className="aurora-veil" aria-hidden />

        <div className="mx-auto max-w-4xl animate-fade-up">
          <span className="eyebrow">Chrome extension + dashboard</span>
          <h1 className="h-serif mx-auto mt-6 max-w-3xl text-6xl text-white sm:text-7xl lg:text-[5.5rem]">
            Turn tab <span className="italic">chaos</span> into{" "}
            <span className="mark">a plan</span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-pretty text-lg leading-8 text-white/65">
            TabZero organizes your open browser tabs into focused workspaces,
            clear priorities, and a timed focus plan — so you know exactly what to
            do next, what to close, and what to ignore.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/new" className="btn-primary">
              New Workspace <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/download" className="btn-secondary">
              <Download className="h-4 w-4" /> Download
            </Link>
          </div>

          <p className="mt-5 inline-flex items-center gap-2 text-sm text-white/50">
            Paste tabs or send them from the extension
            <span className="inline-flex items-center gap-1">
              <span className="kbd">⌘</span>
              <span className="kbd">⏎</span>
            </span>
          </p>
        </div>

        <div className="relative mt-16 animate-fade-up [animation-delay:140ms]">
          <ProductMock />
        </div>

        <p className="mt-8 text-xs text-white/40">
          Only tab titles and URLs are analyzed — never page contents.
        </p>
      </section>

      {/* Value strip */}
      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="surface flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-4 text-sm text-muted-foreground">
          {["No account needed", "Works without an API key", "Titles & URLs only", "Export to Markdown"].map(
            (t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                {t}
              </span>
            ),
          )}
        </div>
      </section>

      {/* Big feature cards with live demos */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <span className="eyebrow">What you get</span>
          <h2 className="h-display mt-3 max-w-2xl text-4xl font-semibold sm:text-5xl">
            A plan, not just a tidy-up
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal delay={1}>
            <BigFeature
              accent
              icon={<Boxes className="h-4 w-4" />}
              eyebrow="Grouping"
              title="Every tab sorted into a group"
              body="Build, Submit, Research, Learn, Opportunities, Communication, Distractions, and Other — each with a keep / save / close call."
            >
              <GroupsDemo />
            </BigFeature>
          </Reveal>

          <Reveal delay={2}>
            <BigFeature
              icon={<ListChecks className="h-4 w-4" />}
              eyebrow="Action plan"
              title="A first move, not a pile"
              body="Concrete next steps tied to your actual tabs, with why each matters, a time estimate, and a checkbox."
            >
              <TasksDemo />
            </BigFeature>
          </Reveal>

          <Reveal delay={1}>
            <BigFeature
              icon={<Siren className="h-4 w-4" />}
              eyebrow="Panic Mode"
              title="Out of time? Get the blunt version"
              body="Do-now, cut, ignore, a minute-by-minute final sprint, and the minimum viable submission that still counts."
            >
              <PanicDemo />
            </BigFeature>
          </Reveal>

          <Reveal delay={2}>
            <BigFeature
              accent
              icon={<Timer className="h-4 w-4" />}
              eyebrow="Focus session"
              title="A plan for the time you have"
              body="Work blocks built from the time you actually have left — not a generic pomodoro."
            >
              <FocusDemo />
            </BigFeature>
          </Reveal>
        </div>
      </section>

      {/* Secondary features */}
      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
          {SMALL_FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={((i % 3) + 1) as 1 | 2 | 3} className="bg-[hsl(240_6%_6%)]">
              <div className="h-full p-6 transition hover:bg-[hsl(240_6%_8%)]">
                <f.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 text-base font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <span className="eyebrow">How it works</span>
          <h2 className="h-display mt-3 text-4xl font-semibold sm:text-5xl">
            Three steps from mess to momentum
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map(([n, title, body], i) => (
            <Reveal key={n} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div className="surface h-full p-6">
                <span className="font-serif text-2xl text-primary">{n}</span>
                <h3 className="mt-3 font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Install */}
      <section id="install" className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <div className="surface p-8 sm:p-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="eyebrow">Get started</span>
                <h2 className="h-display mt-3 text-4xl font-semibold sm:text-5xl">Two ways to start</h2>
                <p className="mt-4 max-w-xl text-muted-foreground">
                  Use the Chrome extension to send your current open tabs in one
                  click, or paste tabs in manually. Either way, you only ever share
                  titles and URLs.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/download" className="btn-primary">
                    <Download className="h-4 w-4" /> Download the apps
                  </Link>
                  <Link href="/new" className="btn-secondary">
                    Paste tabs manually <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {[
                  ["1. Load the extension", "Build from extension/ and load extension/dist as an unpacked extension at chrome://extensions."],
                  ["2. Open the popup", "Enter your goal and time remaining, then send your tabs."],
                  ["3. Get your plan", "TabZero opens a workspace with groups, tasks, and a focus plan."],
                ].map(([t, b]) => (
                  <li key={t} className="surface flex gap-3 p-4">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      <span className="font-medium text-foreground">{t}</span>
                      <br />
                      {b}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
