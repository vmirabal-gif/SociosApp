import { cn } from "@/lib/utils";
import type { EstadoRendicion } from "@/lib/types/cobranza";

const config: Record<EstadoRendicion, { label: string; className: string }> = {
  ABIERTA: {
    label: "Abierta",
    className: "bg-primary/15 text-primary",
  },
  CERRADA: {
    label: "Cerrada",
    className: "bg-muted text-muted-foreground",
  },
};

export function EstadoRendicionBadge({ estado }: { estado: EstadoRendicion }) {
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
