import { cn } from "@/lib/utils";
import type { EstadoCuota } from "@/lib/types/cobranza";

const config: Record<EstadoCuota, { label: string; className: string }> = {
  PENDIENTE: {
    label: "Pendiente",
    className: "bg-status-overdue text-status-overdue-foreground",
  },
  PAGADA: {
    label: "Pagada",
    className: "bg-status-active text-status-active-foreground",
  },
};

export function EstadoCuotaBadge({ estado }: { estado: EstadoCuota }) {
  const c = config[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        c.className
      )}
    >
      {c.label}
    </span>
  );
}
