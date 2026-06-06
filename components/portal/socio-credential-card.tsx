import { cn } from "@/lib/utils";
import type { SocioEstadoPublico } from "@/lib/types/portal-socio";

const portalBadgeConfig: Record<
  SocioEstadoPublico["estado"],
  { label: string; className: string }
> = {
  ACTIVO: {
    label: "ACTIVO",
    className: "bg-status-active text-status-active-foreground",
  },
  MOROSO: {
    label: "MOROSO",
    className: "bg-status-overdue text-status-overdue-foreground",
  },
  INACTIVO: {
    label: "INACTIVO",
    className: "bg-status-overdue text-status-overdue-foreground",
  },
};

interface SocioCredentialCardProps {
  socio: SocioEstadoPublico;
}

export function SocioCredentialCard({ socio }: SocioCredentialCardProps) {
  const badge = portalBadgeConfig[socio.estado];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      <div className="bg-primary px-6 py-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/15 ring-2 ring-primary-foreground/25">
          <span className="text-lg font-bold text-primary-foreground">9J</span>
        </div>
        <p className="text-sm font-medium tracking-wide text-primary-foreground/90">
          Club 9 de Julio Olímpico
        </p>
        <p className="text-xs text-primary-foreground/70">Freyre</p>
      </div>

      <div className="space-y-6 px-6 py-8 text-center">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Socio
          </p>
          <p className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            {socio.nombre} {socio.apellido}
          </p>
        </div>

        <div className="mx-auto h-px w-16 bg-border" />

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Estado del socio
          </p>
          <div className="flex flex-col items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-5 py-2 text-sm font-bold tracking-wide",
                badge.className
              )}
            >
              {badge.label}
            </span>
            {socio.mensajeEstado && (
              <p className="max-w-xs text-sm font-medium text-status-overdue-foreground">
                {socio.mensajeEstado}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-muted/30 px-6 py-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Credencial digital
        </p>
      </div>
    </div>
  );
}
