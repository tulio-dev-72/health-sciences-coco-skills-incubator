import type { RiskLevel, TransferStatus, UserRole } from "@/lib/types";

const statusStyles: Record<TransferStatus, string> = {
  CREATED: "bg-ops-overlay text-ops-text-secondary ring-1 ring-ops-border",
  PENDING_APPROVAL: "bg-ops-warning-muted text-ops-warning ring-1 ring-ops-warning/15",
  APPROVED: "bg-ops-success-muted text-ops-success ring-1 ring-ops-success/15",
  REJECTED: "bg-ops-danger-muted text-ops-danger ring-1 ring-ops-danger/15",
  SETTLED: "bg-ops-info-muted text-ops-info ring-1 ring-ops-info/15",
};

const riskStyles: Record<RiskLevel, string> = {
  low: "bg-ops-success-muted text-ops-success ring-1 ring-ops-success/15",
  medium: "bg-ops-warning-muted text-ops-warning ring-1 ring-ops-warning/15",
  high: "bg-ops-danger-muted text-ops-danger ring-1 ring-ops-danger/15",
};

const badgeBase =
  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]";

export function StatusBadge({ status }: { status: TransferStatus }) {
  const label =
    status === "PENDING_APPROVAL"
      ? "Pending authorization"
      : status.replaceAll("_", " ").toLowerCase();

  return (
    <span className={`${badgeBase} ${statusStyles[status]}`}>{label}</span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const label =
    level === "high" ? "High risk" : level === "medium" ? "Medium risk" : "Low risk";
  return <span className={`${badgeBase} ${riskStyles[level]}`}>{label}</span>;
}

export function ApprovedBadge() {
  return (
    <span className={`${badgeBase} bg-ops-success-muted text-ops-success ring-1 ring-ops-success/15`}>
      Approved
    </span>
  );
}

export function PendingApprovalBadge() {
  return (
    <span className={`${badgeBase} bg-ops-warning-muted text-ops-warning ring-1 ring-ops-warning/15`}>
      Awaiting authorization
    </span>
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  const labels: Record<UserRole, string> = {
    analyst: "Analyst",
    treasury_manager: "Treasury Mgr",
    admin: "Admin",
  };

  return (
    <span className={`${badgeBase} bg-ops-primary-muted text-ops-primary ring-1 ring-ops-primary/10`}>
      {labels[role]}
    </span>
  );
}

export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex min-w-[1.125rem] items-center justify-center rounded-md bg-ops-accent px-1 py-px text-[9px] font-bold text-white">
      {count}
    </span>
  );
}

export function LiveBadge({ live }: { live: boolean }) {
  return (
    <span
      className={`${badgeBase} ${
        live
          ? "bg-ops-success-muted text-ops-success ring-1 ring-ops-success/15"
          : "bg-ops-overlay text-ops-text-secondary ring-1 ring-ops-border"
      }`}
    >
      {live ? "Live" : "Local"}
    </span>
  );
}

export function PrototypeModeBadge() {
  return (
    <span
      className={`${badgeBase} bg-ops-warning-muted text-ops-warning ring-1 ring-ops-warning/15`}
    >
      Prototype Mode
    </span>
  );
}

export function FireblocksStatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const style =
    normalized === "COMPLETED"
      ? "bg-ops-success-muted text-ops-success ring-ops-success/15"
      : normalized === "FAILED" ||
          normalized === "REJECTED" ||
          normalized === "CANCELLED"
        ? "bg-ops-danger-muted text-ops-danger ring-ops-danger/15"
        : "bg-ops-info-muted text-ops-info ring-ops-info/15";

  return <span className={`${badgeBase} ring-1 ${style}`}>{status}</span>;
}
