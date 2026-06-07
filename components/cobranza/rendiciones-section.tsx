"use client";

import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstadoRendicionBadge } from "@/components/cobranza/estado-rendicion-badge";
import { useAuth } from "@/components/auth/auth-provider";
import { canCloseRendiciones } from "@/lib/auth/permissions";
import {
  cerrarRendicion,
  fetchDetalleRendicion,
  fetchRendiciones,
} from "@/lib/cobranza/api";
import { formatCurrencyARS } from "@/lib/cuenta-corriente/utils";
import type { Rendicion, RendicionDetallePago } from "@/lib/types/cobranza";

export function RendicionesSection() {
  const { profile } = useAuth();
  const [rendiciones, setRendiciones] = useState<Rendicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<RendicionDetallePago[]>([]);
  const [cerrarId, setCerrarId] = useState<string | null>(null);
  const [obsCierre, setObsCierre] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cargar = () => {
    setLoading(true);
    fetchRendiciones()
      .then(setRendiciones)
      .catch(() => toast.error("No se pudieron cargar las rendiciones."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const toggleDetalle = async (id: string) => {
    if (expandida === id) {
      setExpandida(null);
      setDetalle([]);
      return;
    }
    setExpandida(id);
    try {
      const d = await fetchDetalleRendicion(id);
      setDetalle(d);
    } catch {
      toast.error("No se pudo cargar el detalle.");
    }
  };

  const handleCerrar = async () => {
    if (!cerrarId) return;
    setIsSubmitting(true);
    try {
      await cerrarRendicion(cerrarId, obsCierre.trim() || undefined);
      toast.success("Rendición cerrada correctamente.");
      setCerrarId(null);
      setObsCierre("");
      cargar();
    } catch {
      toast.error("No se pudo cerrar la rendición.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFecha = (f: string) =>
    new Date(f + "T12:00:00").toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            Rendiciones de cobradores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : rendiciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay rendiciones registradas.
            </p>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10" />
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cobrador</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Pagos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rendiciones.map((r) => (
                    <Fragment key={r.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleDetalle(r.id)}
                          >
                            {expandida === r.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>{formatFecha(r.fecha)}</TableCell>
                        <TableCell className="font-medium">
                          {r.cobradorNombre}
                        </TableCell>
                        <TableCell>
                          <EstadoRendicionBadge estado={r.estado} />
                        </TableCell>
                        <TableCell className="text-right">
                          {r.cantidadPagos}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrencyARS(r.totalRendido)}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.estado === "ABIERTA" &&
                            canCloseRendiciones(profile?.rol) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCerrarId(r.id)}
                            >
                              Cerrar rendición
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandida === r.id && detalle.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/20 p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Socio</TableHead>
                                  <TableHead>Cuota</TableHead>
                                  <TableHead>Hora</TableHead>
                                  <TableHead className="text-right">
                                    Importe
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {detalle.map((p) => (
                                  <TableRow key={p.id}>
                                    <TableCell>
                                      {p.socioApellido}, {p.socioNombre}
                                    </TableCell>
                                    <TableCell>
                                      {p.cuotaConcepto} ({p.cuotaPeriodo})
                                    </TableCell>
                                    <TableCell>{formatHora(p.fechaHora)}</TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrencyARS(p.importe)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={cerrarId !== null} onOpenChange={() => setCerrarId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar rendición</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="obs-cierre">Observaciones (opcional)</Label>
            <Textarea
              id="obs-cierre"
              value={obsCierre}
              onChange={(e) => setObsCierre(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCerrarId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleCerrar} disabled={isSubmitting}>
              {isSubmitting ? "Cerrando..." : "Confirmar cierre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
