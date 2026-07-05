// Animated, schematic product frame for the landing page. It mirrors the real
// workspace structure (category lanes + keep/save/close actions) using abstract
// bars only — no fabricated tabs, titles, URLs, or workspace content.

const LANES = [
  { name: "Build", action: "keep", color: "160 84% 45%", bars: 3 },
  { name: "Submit", action: "keep", color: "258 90% 66%", bars: 2 },
  { name: "Research", action: "keep", color: "200 90% 60%", bars: 3 },
  { name: "Learn", action: "save", color: "220 80% 64%", bars: 2 },
  { name: "Distractions", action: "close", color: "0 80% 63%", bars: 4 },
];

const ACTION_CLS: Record<string, string> = {
  keep: "text-emerald-300/90 border-emerald-400/20 bg-emerald-400/10",
  save: "text-sky-300/90 border-sky-400/20 bg-sky-400/10",
  close: "text-red-300/90 border-red-400/20 bg-red-400/10",
};

export function ProductMock() {
  return (
    <div className="product-mock surface mx-auto w-full max-w-4xl overflow-hidden p-0 ring-1 ring-white/10 shadow-[0_50px_150px_-40px_rgba(139,92,246,0.45)]">
      <div className="product-mock__glow product-mock__glow--primary" aria-hidden />
      <div className="product-mock__glow product-mock__glow--secondary" aria-hidden />
      <div className="product-mock__sheen" aria-hidden />

      {/* Window chrome */}
      <div className="relative z-10 flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-white/15" />
        <span className="h-3 w-3 rounded-full bg-white/15" />
        <span className="h-3 w-3 rounded-full bg-white/15" />
        <div className="mx-auto flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[0.7rem] text-muted-foreground">
          <span className="product-mock__live-dot h-1.5 w-1.5 rounded-full bg-primary" />
          tabzero.app / workspace
        </div>
        <span className="hidden text-[0.7rem] text-muted-foreground sm:inline">⌘⏎</span>
      </div>

      {/* Body */}
      <div className="relative z-10 grid gap-4 p-5 sm:grid-cols-[1.6fr_1fr] sm:p-6">
        {/* Left: grouped lanes */}
        <div className="space-y-2.5">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2.5 w-32 rounded-full bg-white/15" />
            <span className="product-mock__badge ml-auto rounded-md border border-red-400/20 bg-red-400/10 px-2 py-0.5 text-[0.6rem] font-medium text-red-300/90">
              high urgency
            </span>
          </div>
          {LANES.map((lane, laneIndex) => (
            <div
              key={lane.name}
              className="product-lane rounded-xl border border-white/[0.06] bg-white/[0.015] p-3"
              style={{ animationDelay: `${laneIndex * 110}ms` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="product-lane__dot h-2 w-2 rounded-full"
                  style={{ background: `hsl(${lane.color})` }}
                />
                <span className="text-xs font-medium text-foreground/85">{lane.name}</span>
                <span
                  className={`ml-auto rounded-md border px-1.5 py-0.5 text-[0.58rem] font-medium ${ACTION_CLS[lane.action]}`}
                >
                  {lane.action}
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5">
                {Array.from({ length: lane.bars }).map((_, barIndex) => (
                  <div key={barIndex} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-[3px] bg-white/[0.13]" />
                    <span
                      className="product-bar h-1.5 rounded-full bg-white/[0.13]"
                      style={{
                        width: `${88 - barIndex * 16}%`,
                        animationDelay: `${laneIndex * 110 + barIndex * 85}ms`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: next action + focus */}
        <div className="space-y-4">
          <div className="product-panel product-panel--primary rounded-xl border border-primary/25 bg-primary/[0.07] p-3.5">
            <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-primary">
              First thing to do
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="product-bar h-2 w-full rounded-full bg-white/12" />
              <div className="product-bar h-2 w-4/5 rounded-full bg-white/[0.13] [animation-delay:180ms]" />
            </div>
          </div>

          <div className="product-panel rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
            <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Focus session
            </div>
            <div className="mt-2.5 space-y-2">
              {[50, 10, 35].map((m, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="grid h-7 w-9 shrink-0 place-items-center rounded-md bg-primary/15 text-[0.62rem] font-semibold text-primary">
                    {m}m
                  </span>
                  <span
                    className="product-bar h-1.5 rounded-full bg-white/[0.13]"
                    style={{ width: `${70 - i * 12}%`, animationDelay: `${260 + i * 120}ms` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
