import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "overdue" | "suspended";
}

const statusConfig = {
  active: {
    label: "Activo",
    className: "bg-status-active text-status-active-foreground",
  },
  overdue: {
    label: "Moroso",
    className: "bg-status-overdue text-status-overdue-foreground",
  },
  suspended: {
    label: "Suspendido",
    className: "bg-status-suspended text-status-suspended-foreground",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
