import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { GroupAction, Priority, UrgencyLevel } from "@/lib/types";

type Tone =
  | "neutral"
  | "violet"
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "slate";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  violet: "bg-primary/15 text-primary border-primary/30",
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  red: "bg-red-500/15 text-red-300 border-red-500/30",
  blue: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  slate: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function priorityTone(priority: Priority): Tone {
  return priority === "high" ? "red" : priority === "medium" ? "amber" : "slate";
}

export function urgencyTone(level: UrgencyLevel): Tone {
  return level === "high" ? "red" : level === "medium" ? "amber" : "green";
}

export function actionTone(action: GroupAction): Tone {
  return action === "keep" ? "green" : action === "save" ? "blue" : "red";
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("glass glass-hover p-5", className)}>{children}</div>;
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="surface px-4 py-3.5">
      <div className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  icon,
  count,
}: {
  children: ReactNode;
  icon?: ReactNode;
  count?: number;
}) {
  return (
    <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
      <span aria-hidden className="h-5 w-1 rounded-full bg-primary" />
      {icon}
      <span>{children}</span>
      {typeof count === "number" ? (
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-normal text-muted-foreground ring-1 ring-inset ring-white/10">
          {count}
        </span>
      ) : null}
    </h2>
  );
}
