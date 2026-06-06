"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, DollarSign } from "lucide-react";
import {
  fetchConfiguracionCuotas,
  updateConfiguracionCuotas,
} from "@/lib/cuenta-corriente/api";
import type { ConfiguracionCuota } from "@/lib/types/cuenta-corriente";

export function CuotasConfigSection() {
  const [cuotas, setCuotas] = useState<ConfiguracionCuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchConfiguracionCuotas();
        if (!cancelled) setCuotas(data);
      } catch {
        if (!cancelled) {
          toast.error("No se pudo cargar la configuración de cuotas.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMontoChange = (
    tipoSocio: ConfiguracionCuota["tipoSocio"],
    value: string
  ) => {
    const monto = value === "" ? 0 : Number(value);
    setCuotas((prev) =>
      prev.map((c) =>
        c.tipoSocio === tipoSocio
          ? { ...c, monto: isNaN(monto) ? 0 : monto }
          : c
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const actualizadas = await updateConfiguracionCuotas(cuotas);
      setCuotas(actualizadas);
      toast.success("Configuración de cuotas guardada correctamente.");
    } catch {
      toast.error("No se pudo guardar la configuración. Intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Cuotas mensuales
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-4 sm:max-w-md">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Valores de cuota mensual por tipo de socio. Al guardar se cierra
              la tarifa vigente y se crea una nueva, manteniendo el historial.
            </p>

            <div className="grid gap-4 sm:max-w-md">
              {cuotas.map((cuota) => (
                <div key={cuota.tipoSocio} className="space-y-2">
                  <Label htmlFor={`cuota-${cuota.tipoSocio}`}>
                    {cuota.label}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id={`cuota-${cuota.tipoSocio}`}
                      type="number"
                      min="0"
                      step="1"
                      value={cuota.monto}
                      onChange={(e) =>
                        handleMontoChange(cuota.tipoSocio, e.target.value)
                      }
                      className="pl-7"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
