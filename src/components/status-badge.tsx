import clsx from "clsx";

const statusMap: Record<string, string> = {
  ACTIVE: "success",
  TRIAL: "info",
  EXPIRING: "warning",
  EXPIRED: "danger",
  ERROR: "danger",
  CRITICAL: "danger",
  WARNING: "warning",
  INFO: "info",
  DRAFT: "info",
  PAUSED: "warning",
  CANCELLED: "danger",
  SUSPENDED: "danger",
};

export function StatusBadge({ value }: { value: string }) {
  return <span className={clsx("badge", statusMap[value] ?? "info")}>{value}</span>;
}
