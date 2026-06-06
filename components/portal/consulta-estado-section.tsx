"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SocioCredentialCard } from "@/components/portal/socio-credential-card";
import { consultarEstadoSocio } from "@/lib/socios/portal-api";
import type { SocioEstadoPublico } from "@/lib/types/portal-socio";

export function ConsultaEstadoSection() {
  const [dni, setDni] = useState("");
  const [resultado, setResultado] = useState<SocioEstadoPublico | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResultado(null);
    setNoEncontrado(false);
    setError(null);

    try {
      const socio = await consultarEstadoSocio({ dni });

      if (!socio) {
        setNoEncontrado(true);
      } else {
        setResultado(socio);
      }
    } catch {
      setError(
        "No se pudo completar la consulta. Intentá nuevamente en unos minutos."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Consultar estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                name="dni"
                inputMode="numeric"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej: 30123456"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
              <Search className="h-4 w-4" />
              {isSubmitting ? "Consultando..." : "Consultar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {noEncontrado && (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            No se encontró ningún socio con ese DNI.
          </CardContent>
        </Card>
      )}

      {resultado && <SocioCredentialCard socio={resultado} />}
    </div>
  );
}
