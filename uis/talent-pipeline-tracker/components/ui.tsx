import type { ReactNode } from "react";

export function SectionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={["tracker-card rounded-[28px] p-6", className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "neutral" | "warning" | "success" | "danger";
  children: ReactNode;
}) {
  const toneClassName = {
    neutral: "bg-white/70 text-stone-700",
    warning: "bg-amber-100 text-amber-900",
    success: "bg-emerald-100 text-emerald-900",
    danger: "bg-rose-100 text-rose-900",
  }[tone];

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        toneClassName,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
      {children}
    </label>
  );
}