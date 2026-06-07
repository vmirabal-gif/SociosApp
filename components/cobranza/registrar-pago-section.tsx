"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, CreditCard, CheckSquare, Square, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EstadoCuotaBadge } from "@/components/cobranza/estado-cuota-badge";
import { ComprobantePagoView } from "@/components/cobranza/comprobante-pago";
import {
  buscarSociosCobranza,
  fetchCobradores,
  fetchCuotasPendientesSocio,
  registrarPagoCobranza,
} from "@/lib/cobranza/api";
import { formatCurrencyARS } from "@/lib/cuenta-corriente/utils";
import {
  mediosPago,
  type ComprobantePago,
  type CuotaPendiente,
  type MedioPago,
  type SocioBusquedaCobranza,
} from "@/lib/types/cobranza";
import type { Cobrador } from "@/lib/types/cobranza";
import { fetchSocioById } from "@/lib/socios/api";
import type { Member } from "@/lib/types/socios";
import { useAuth } from "@/components/auth/auth-provider";
import { roleLabels } from "@/lib/types/auth";

export function RegistrarPagoSection() {
  const { profile } = useAuth();
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [cobradorId, setCobradorId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<SocioBusquedaCobranza[]>([]);
  const [socioSeleccionado, setSocioSeleccionado] =
    useState<SocioBusquedaCobranza | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [cuotas, setCuotas] = useState<CuotaPendiente[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [medioPago, setMedioPago] = useState<MedioPago>("EFECTIVO");
  const [observaciones, setObservaciones] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comprobante, setComprobante] = useState<ComprobantePago | null>(null);

  useEffect(() => {
    fetchCobradores(true)
      .then((data) => {
        setCobradores(data);
        if (profile?.rol === "COBRADOR" && data[0]) {
          setCobradorId(data[0].id);
        }
      })
      .catch(() => toast.error("No se pudieron cargar los cobradores."));
  }, [profile?.rol]);

  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setResultados([]);
      return;
    }

    const timer = setTimeout(() => {
      buscarSociosCobranza(busqueda)
        .then(setResultados)
        .catch(() => toast.error("Error al buscar socios."));
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  const seleccionarSocio = async (socio: SocioBusquedaCobranza) => {
    setSocioSeleccionado(socio);
    setBusqueda("");
    setResultados([]);
    setSeleccionadas(new Set());
    setComprobante(null);

    try {
      const m = await fetchSocioById(socio.id);
      if (!m) return;
      setMember(m);
      const pendientes = await fetchCuotasPendientesSocio(m);
      setCuotas(pendientes);
    } catch {
      toast.error("No se pudieron cargar las cuotas pendientes.");
    }
  };

  const toggleCuota = (id: string) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalSeleccionado = cuotas
    .filter((c) => seleccionadas.has(c.id))
    .reduce((s, c) => s + c.montoPendiente, 0);

  const handleRegistrar = async () => {
    if (profile?.rol !== "COBRADOR" && !cobradorId) {
      toast.error("Seleccioná un cobrador.");
      return;
    }
    if (!socioSeleccionado) {
      toast.error("Seleccioná un socio.");
      return;
    }
    if (seleccionadas.size === 0) {
      toast.error("Seleccioná al menos una cuota.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registrarPagoCobranza({
        cobradorId,
        socioId: socioSeleccionado.id,
        cuotaIds: Array.from(seleccionadas),
        medioPago,
        observaciones: observaciones.trim() || undefined,
      });
      setComprobante(result);
      toast.success("Pago registrado correctamente.");
      setSeleccionadas(new Set());
      if (member) {
        const pendientes = await fetchCuotasPendientesSocio(member);
        setCuotas(pendientes);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo registrar el pago."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const reiniciar = () => {
    setComprobante(null);
    setSocioSeleccionado(null);
    setMember(null);
    setCuotas([]);
    setSeleccionadas(new Set());
    setObservaciones("");
  };

  if (comprobante) {
    return <ComprobantePagoView comprobante={comprobante} onNuevoPago={reiniciar} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Registrar pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cobrador</Label>
            {profile?.rol === "COBRADOR" ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">
                  {profile.nombre} {profile.apellido}
                </p>
                <p className="text-muted-foreground">{roleLabels[profile.rol]}</p>
              </div>
            ) : cobradores.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                <p>No hay cobradores activos.</p>
                <Link
                  href="/cobranza/cobradores"
                  className="mt-2 inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  <UserCog className="h-4 w-4" />
                  Registrar cobrador
                </Link>
              </div>
            ) : (
              <Select value={cobradorId} onValueChange={setCobradorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cobrador" />
                </SelectTrigger>
                <SelectContent>
                  {cobradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} {c.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="busqueda-socio">Buscar socio</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="busqueda-socio"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, apellido o DNI"
                className="pl-9"
              />
            </div>
            {resultados.length > 0 && (
              <div className="rounded-lg border border-border bg-card shadow-sm">
                {resultados.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/50 border-b border-border last:border-0"
                    onClick={() => seleccionarSocio(s)}
                  >
                    <span>
                      {s.apellido}, {s.nombre} — DNI {s.dni}
                    </span>
                    <StatusBadge status={s.status} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {socioSeleccionado && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="font-medium">
                {socioSeleccionado.nombre} {socioSeleccionado.apellido}
              </p>
              <p className="text-sm text-muted-foreground">
                DNI {socioSeleccionado.dni}
                {socioSeleccionado.familyGroup &&
                  ` · Grupo: ${socioSeleccionado.familyGroup}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {socioSeleccionado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cuotas pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cuotas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay cuotas pendientes para este socio.
              </p>
            ) : (
              <>
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10" />
                        <TableHead>Período</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cuotas.map((c) => (
                        <TableRow
                          key={c.id}
                          className="cursor-pointer"
                          onClick={() => toggleCuota(c.id)}
                        >
                          <TableCell>
                            {seleccionadas.has(c.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>{c.periodo}</TableCell>
                          <TableCell>{c.concepto}</TableCell>
                          <TableCell>
                            <EstadoCuotaBadge estado={c.estado} />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrencyARS(c.montoPendiente)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {seleccionadas.size > 0 && (
                  <p className="text-sm font-medium">
                    Total a cobrar: {formatCurrencyARS(totalSeleccionado)}
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Medio de pago</Label>
                    <Select
                      value={medioPago}
                      onValueChange={(v) => setMedioPago(v as MedioPago)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mediosPago.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="obs">Observaciones (opcional)</Label>
                  <Textarea
                    id="obs"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleRegistrar}
                  disabled={isSubmitting || seleccionadas.size === 0}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? "Registrando..." : "Registrar pago"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
