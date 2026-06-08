"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";
import { generarCuotasMasivas } from "@/lib/cuenta-corriente/api";
import { getPeriodoActual } from "@/lib/cuenta-corriente/utils";
import {
  GeneracionCuotasError,
  type GeneracionMasivaDiagnostico,
} from "@/lib/types/cuenta-corriente";

export function GeneracionCuotasSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<{
    periodo: string;
    creados: number;
    omitidos: number;
  } | null>(null);
  const [diagnostico, setDiagnostico] = useState<GeneracionMasivaDiagnostico | null>(
    null
  );

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(
    getPeriodoActual()
  );

  const handleGenerar = async () => {
    console.log(
      "[GeneracionCuotasSection] Click — período seleccionado:",
      periodoSeleccionado
    );
    setIsSubmitting(true);
    setDiagnostico(null);

    try {
      const resultado = await generarCuotasMasivas(periodoSeleccionado);
      setUltimoResultado(resultado);
      setDiagnostico(resultado.diagnostico);
      toast.success(
        `Cuotas generadas: ${resultado.creados} creadas, ${resultado.omitidos} omitidas.`
      );
    } catch (err) {
      const diag =
        err instanceof GeneracionCuotasError ? err.diagnostico : null;
      if (diag) setDiagnostico(diag);

      const message =
        err instanceof Error
          ? err.message
          : "No se pudo completar la generación masiva.";

      console.error("[GeneracionCuotasSection] Error:", err);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5" />
          Generación masiva de cuotas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Genera las cuotas del período seleccionado para todos los socios
          activos. Los grupos familiares se procesan una sola vez por grupo.
          Los socios inactivos manuales se omiten.
        </p>

        <div className="space-y-2 sm:max-w-xs">
          <Label htmlFor="periodo-masivo">Período (YYYY-MM)</Label>
          <Input
            id="periodo-masivo"
            type="month"
            value={periodoSeleccionado}
            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Button onClick={handleGenerar} disabled={isSubmitting}>
          {isSubmitting ? "Generando..." : "Generar Cuotas del Mes"}
        </Button>

        {ultimoResultado && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Última ejecución — {ultimoResultado.periodo}</p>
            <p className="mt-1 text-muted-foreground">
              Cuotas creadas:{" "}
              <span className="font-medium text-foreground">
                {ultimoResultado.creados}
              </span>
            </p>
            <p className="text-muted-foreground">
              Cuotas omitidas:{" "}
              <span className="font-medium text-foreground">
                {ultimoResultado.omitidos}
              </span>
            </p>
          </div>
        )}

        {diagnostico && (
          <div className="max-w-full space-y-2 overflow-x-auto break-words rounded-lg border border-dashed border-border bg-muted/20 p-4 font-mono text-xs">
            <p className="font-sans font-medium text-sm text-foreground">
              Diagnóstico temporal
            </p>
            <p>Socios encontrados: {diagnostico.sociosEncontrados}</p>
            <p>Grupos familiares encontrados: {diagnostico.gruposEncontrados}</p>
            <p>
              Tarifas vigentes: INDIVIDUAL=
              {diagnostico.tarifasVigentes.INDIVIDUAL ?? "N/A"}, FAMILIAR=
              {diagnostico.tarifasVigentes.FAMILIAR ?? "N/A"}, BECADO=
              {diagnostico.tarifasVigentes.BECADO ?? "N/A"}
            </p>
            <p>Cuotas creadas: {diagnostico.creados}</p>
            <p>Cuotas omitidas: {diagnostico.omitidos}</p>
            <p>
              Generación preexistente:{" "}
              {diagnostico.generacionPreexistente ? "sí" : "no"}
            </p>
            {diagnostico.errorDetalle && (
              <p className="text-destructive">
                Error: {diagnostico.errorDetalle}
              </p>
            )}
            <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
              {diagnostico.logs.map((log, i) => (
                <p key={i} className="text-muted-foreground">
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
