// Schematic, animated mini-demos embedded in the landing feature cards.
// All abstract bars / product chrome — no fabricated tabs, titles, URLs, or
// workspace content. Pure CSS animation, no client JS.

function Bars({ widths, dim = false }: { widths: number[]; dim?: boolean }) {
  return (
    <div className="space-y-1.5">
      {widths.map((w, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-[3px] ${dim ? "bg-white/10" : "bg-white/15"}`} />
          <span
            className={`h-1.5 rounded-full ${dim ? "bg-white/10" : "bg-white/15"}`}
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function GroupsDemo() {
  const lanes = [
    { name: "Build", action: "keep", cls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20", dot: "160 84% 50%", bars: [88, 70] },
    { name: "Research", action: "keep", cls: "text-sky-300 bg-sky-400/10 border-sky-400/20", dot: "200 90% 60%", bars: [80] },
    { name: "Distractions", action: "close", cls: "text-red-300 bg-red-400/10 border-red-400/20", dot: "0 80% 63%", bars: [64, 52] },
  ];
  return (
    <div className="space-y-2.5">
      {lanes.map((l) => (
        <div key={l.name} className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${l.dot})` }} />
            <span className="text-xs font-medium text-white/85">{l.name}</span>
            <span className={`ml-auto rounded-md border px-1.5 py-0.5 text-[0.58rem] font-medium ${l.cls}`}>
              {l.action}
            </span>
          </div>
          <div className="mt-2.5">
            <Bars widths={l.bars} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TasksDemo() {
  const tasks = [
    { done: true, w: 58, pr: "high" },
    { done: false, w: 72, pr: "high" },
    { done: false, w: 64, pr: "med" },
  ];
  return (
    <div className="space-y-2">
      {tasks.map((t, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3">
          <span
            className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border ${
              t.done ? "border-emerald-500 bg-emerald-500" : "border-white/20"
            }`}
          >
            {t.done ? (
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2.5 6.5l2.2 2.2L9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </span>
          <span className={`h-1.5 rounded-full bg-white/15 ${t.done ? "opacity-40" : ""}`} style={{ width: `${t.w}%` }} />
          <span className="ml-auto rounded-md bg-white/5 px-1.5 py-0.5 text-[0.55rem] text-white/50">{t.pr}</span>
        </div>
      ))}
    </div>
  );
}

export function PanicDemo() {
  const cols = [
    { label: "Do now", cls: "text-emerald-300", bars: [90, 72, 60] },
    { label: "Cut", cls: "text-amber-300", bars: [76, 58] },
    { label: "Ignore", cls: "text-red-300", bars: [64, 50] },
  ];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2">
        <span className="font-mono text-sm font-semibold text-red-200">
          01<span className="blink">:</span>58
        </span>
        <span className="text-[0.62rem] uppercase tracking-wider text-red-300/80">left</span>
        <span className="ml-auto inline-flex h-5 items-end gap-0.5 text-red-300/70 waveform">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} style={{ height: "100%", animationDelay: `${i * 0.12}s` }} />
          ))}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cols.map((c) => (
          <div key={c.label} className="rounded-lg border border-white/[0.07] bg-black/20 p-2.5">
            <div className={`text-[0.6rem] font-semibold uppercase tracking-wide ${c.cls}`}>{c.label}</div>
            <div className="mt-2">
              <Bars widths={c.bars} dim />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FocusDemo() {
  const blocks = [
    { m: 50, w: 100, active: true },
    { m: 10, w: 40, active: false },
    { m: 35, w: 70, active: false },
  ];
  return (
    <div className="space-y-2.5">
      {blocks.map((b, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 rounded-xl border p-3 ${
            b.active ? "border-primary/40 bg-primary/10" : "border-white/[0.07] bg-black/20"
          }`}
        >
          <span
            className={`grid h-8 w-11 shrink-0 place-items-center rounded-lg text-xs font-semibold ${
              b.active ? "bg-primary/25 text-white" : "bg-white/5 text-white/70"
            }`}
          >
            {b.m}m
          </span>
          <span className="h-1.5 rounded-full bg-white/15" style={{ width: `${b.w * 0.7}%` }} />
          {b.active ? (
            <span className="ml-auto inline-flex items-center gap-1 text-[0.6rem] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary blink" /> now
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
