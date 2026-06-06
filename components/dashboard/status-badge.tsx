import { cn } from "@/lib/utils";
import type { EstadoSocio } from "@/lib/types/socios";

interface StatusBadgeProps {
  status: EstadoSocio;
}

const statusConfig: Record<
  EstadoSocio,
  { label: string; className: string }
> = {
  ACTIVO: {
    label: "Activo",
    className: "bg-status-active text-status-active-foreground",
  },
  MOROSO: {
    label: "Moroso",
    className: "bg-status-overdue text-status-overdue-foreground",
  },
  INACTIVO: {
    label: "Inactivo",
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
