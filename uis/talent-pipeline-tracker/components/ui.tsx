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

export function ErrorState({
  message,
  onRetry,
  actionLabel = "Reintentar",
  secondaryAction,
}: {
  message: string;
  onRetry?: () => void;
  actionLabel?: string;
  secondaryAction?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] bg-rose-100 px-5 py-6 text-rose-900">
      <p className="text-sm leading-6">{message}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-rose-300 px-4 py-2 transition hover:border-rose-500"
          >
            {actionLabel}
          </button>
        ) : null}
        {secondaryAction}
      </div>
    </div>
  );
}