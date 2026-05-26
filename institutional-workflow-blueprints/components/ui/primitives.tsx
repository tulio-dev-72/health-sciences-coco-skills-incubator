import type { ReactNode } from "react";

export type CardVariant = "surface" | "elevated" | "accent" | "ghost";

const cardVariants: Record<CardVariant, string> = {
  surface: "bg-ops-surface border-ops-border shadow-[var(--ops-shadow-sm)]",
  elevated:
    "bg-ops-elevated border-ops-border shadow-[var(--ops-shadow-md)]",
  accent:
    "bg-ops-surface border-ops-border shadow-[var(--ops-shadow-md)] ring-1 ring-ops-primary/8",
  ghost: "bg-transparent border-ops-border-subtle",
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
      className={`rounded-xl border p-4 text-ops-text ${cardVariants[resolved]} ${className}`}
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
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        {label ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ops-text-dim">
            {label}
          </p>
        ) : null}
        <h2 className={`font-semibold tracking-tight text-ops-text ${label ? "mt-1" : ""} text-sm`}>
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-ops-text-secondary">{subtitle}</p>
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
      className={`inline-flex items-center justify-center rounded-lg bg-ops-primary px-4 py-2.5 text-xs font-semibold text-white shadow-[var(--ops-shadow-sm)] transition hover:bg-ops-primary-hover disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
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
      className={`inline-flex min-h-11 items-center justify-center whitespace-normal rounded-lg border border-ops-border bg-ops-surface px-4 py-2.5 text-xs font-medium text-ops-text shadow-[var(--ops-shadow-sm)] transition hover:border-ops-text-dim/30 hover:bg-ops-overlay disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
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
      className={`inline-flex min-h-11 items-center justify-center whitespace-normal rounded-lg border border-ops-border bg-transparent px-3 py-2 text-xs font-medium text-ops-text-secondary transition hover:border-ops-text-dim/30 hover:bg-ops-overlay hover:text-ops-text disabled:opacity-40 ${className}`}
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
      className={`inline-flex min-h-11 items-center justify-center whitespace-normal rounded-lg border border-ops-danger/20 bg-ops-danger-muted px-4 py-2.5 text-xs font-medium text-ops-danger transition hover:border-ops-danger/35 disabled:opacity-40 ${className}`}
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
      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim"
    >
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-ops-border bg-ops-surface px-3 py-2.5 text-sm text-ops-text shadow-[var(--ops-shadow-sm)] outline-none transition placeholder:text-ops-text-dim focus:border-ops-info/40 focus:ring-2 focus:ring-ops-info/10";

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
    <div className="rounded-xl border border-ops-border bg-ops-surface px-4 py-3 shadow-[var(--ops-shadow-sm)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-semibold tabular-nums tracking-tight ${accent ? "text-ops-accent" : "text-ops-text"}`}
      >
        {value}
      </p>
    </div>
  );
}
