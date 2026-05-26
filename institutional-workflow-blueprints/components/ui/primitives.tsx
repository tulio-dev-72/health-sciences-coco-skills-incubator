import type { ReactNode } from "react";

export type CardVariant = "surface" | "elevated" | "accent" | "ghost";

const cardVariants: Record<CardVariant, string> = {
  surface:
    "bg-ops-surface border-ops-border shadow-[var(--ops-shadow-sm)] ring-1 ring-ops-primary/[0.04]",
  elevated:
    "bg-ops-elevated border-ops-border shadow-[var(--ops-shadow-md)] ring-1 ring-ops-primary/[0.08]",
  accent:
    "bg-ops-surface border-ops-border shadow-[var(--ops-shadow-md)] ring-1 ring-ops-primary/20",
  ghost:
    "bg-ops-surface border-ops-border-subtle shadow-[var(--ops-shadow-sm)] ring-1 ring-ops-primary/[0.03]",
};

export function Card({
  children,
  className = "",
  variant = "surface",
  tone,
}: {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
  tone?: "light" | "dark";
}) {
  const resolved = tone === "light" ? "elevated" : tone === "dark" ? "surface" : variant;

  return (
    <div
      className={`rounded-xl border p-4 text-ops-text sm:p-5 ${cardVariants[resolved]} ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  label,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  label?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        {label ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ops-text-dim">
            {label}
          </p>
        ) : null}
        <h2
          className={`font-semibold tracking-tight text-ops-text ${label ? "mt-1.5" : ""} text-lg leading-snug`}
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-ops-text-secondary">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-lg bg-ops-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--ops-shadow-md)] ring-1 ring-ops-primary/30 transition hover:bg-ops-primary-hover hover:shadow-[var(--ops-shadow-lg)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center whitespace-normal rounded-lg border border-ops-border bg-ops-surface px-4 py-2.5 text-sm font-semibold text-ops-text shadow-[var(--ops-shadow-sm)] ring-1 ring-ops-primary/[0.06] transition hover:border-ops-primary/35 hover:bg-ops-overlay hover:shadow-[var(--ops-shadow-md)] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center whitespace-normal rounded-lg border border-ops-border-subtle bg-ops-surface px-3 py-2 text-sm font-semibold text-ops-text-secondary shadow-[var(--ops-shadow-sm)] transition hover:border-ops-border hover:bg-ops-overlay hover:text-ops-text disabled:opacity-45 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center whitespace-normal rounded-lg border border-ops-danger/40 bg-ops-danger-muted px-4 py-2.5 text-sm font-semibold text-ops-danger shadow-[var(--ops-shadow-sm)] ring-1 ring-ops-danger/20 transition hover:border-ops-danger/55 hover:bg-ops-danger-muted active:scale-[0.99] disabled:opacity-45 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function InputLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-ops-text-dim"
    >
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-ops-border bg-ops-surface px-3 py-2.5 text-sm font-medium text-ops-text shadow-[var(--ops-shadow-sm)] outline-none transition placeholder:text-ops-text-dim focus:border-ops-primary/45 focus:ring-2 focus:ring-ops-primary/15";

export function TextInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function SelectInput({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function TextArea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={`min-h-20 ${inputClass} ${className}`} {...props} />
  );
}

export function StatTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ops-border bg-ops-surface px-4 py-4 shadow-[var(--ops-shadow-sm)] ring-1 ring-ops-primary/[0.05]">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ops-text-dim">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-semibold tabular-nums tracking-tight ${accent ? "text-ops-accent" : "text-ops-text"}`}
      >
        {value}
      </p>
    </div>
  );
}
