"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCurrencyARS,
  getSaldoLabel,
  getPeriodoActual,
  saldoTipoClassName,
} from "@/lib/cuenta-corriente/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  registrarPago,
  generarCuotaIndividual,
  eliminarMovimiento,
} from "@/lib/cuenta-corriente/api";
import type {
  CuentaCorrienteView,
  MovimientoCuenta,
  SaldoCuenta,
} from "@/lib/types/cuenta-corriente";
import type { Member } from "@/lib/types/socios";
import { CreditCard, Users, Receipt, PlusCircle, Trash2 } from "lucide-react";

interface CuentaCorrienteSectionProps {
  member: Member;
  cuenta: CuentaCorrienteView;
  saldo: SaldoCuenta;
  onRefresh: () => Promise<void>;
}

export function CuentaCorrienteSection({
  member,
  cuenta,
  saldo,
  onRefresh,
}: CuentaCorrienteSectionProps) {
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [cuotaDialogOpen, setCuotaDialogOpen] = useState(false);
  const [periodoCuota, setPeriodoCuota] = useState(getPeriodoActual());
  const [movimientoAEliminar, setMovimientoAEliminar] =
    useState<MovimientoCuenta | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T12:00:00").toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleRegistrarPago = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const monto = Number(form.get("monto"));

    if (!monto || monto <= 0) {
      toast.error("Ingresá un monto válido mayor a cero.");
      setIsSubmitting(false);
      return;
    }

    try {
      await registrarPago(member, {
        monto,
        fecha: String(form.get("fecha") ?? ""),
        notas: String(form.get("notas") ?? "").trim() || undefined,
      });
      toast.success("Pago registrado correctamente.");
      setPagoDialogOpen(false);
      await onRefresh();
    } catch {
      toast.error("No se pudo registrar el pago. Intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerarCuota = async () => {
    setIsSubmitting(true);

    try {
      const { result, periodo } = await generarCuotaIndividual(
        member,
        periodoCuota
      );

      if (result === "created") {
        toast.success(`Cuota de ${periodo} generada correctamente.`);
        setCuotaDialogOpen(false);
        await onRefresh();
      } else if (result === "skipped") {
        toast.info(`Ya existe una cuota para el período ${periodo}.`);
      } else {
        toast.error(
          "No se puede generar la cuota: socio inactivo manual o aún no corresponde según fecha de alta."
        );
      }
    } catch {
      toast.error("No se pudo generar la cuota. Intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminarMovimiento = async () => {
    if (!movimientoAEliminar) return;

    setIsSubmitting(true);
    try {
      await eliminarMovimiento(member, movimientoAEliminar.id);
      toast.success("Movimiento eliminado correctamente.");
      setMovimientoAEliminar(null);
      await onRefresh();
    } catch {
      toast.error("No se pudo eliminar el movimiento. Intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMovimientoTipoLabel = (mov: MovimientoCuenta) =>
    mov.cargo != null ? "cargo" : "pago";

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Cuenta Corriente
            </CardTitle>
            {cuenta.esGrupoFamiliar && cuenta.nombreGrupo && (
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  Grupo: {cuenta.nombreGrupo}
                </Badge>
              </div>
            )}
          </div>
          <p className={`text-lg font-semibold ${saldoTipoClassName(saldo.tipo)}`}>
            {getSaldoLabel(saldo)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {cuenta.esGrupoFamiliar && (
            <p className="text-sm text-muted-foreground">
              Esta cuenta corriente corresponde al grupo familiar. Los movimientos
              son compartidos por todos los integrantes.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              className="gap-2"
              onClick={() => setPagoDialogOpen(true)}
            >
              <Receipt className="h-4 w-4" />
              Registrar pago
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setPeriodoCuota(getPeriodoActual());
                setCuotaDialogOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4" />
              Generar cuota
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Cargo</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuenta.movimientos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No hay movimientos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  cuenta.movimientos.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(mov.fecha)}
                      </TableCell>
                      <TableCell>{mov.concepto}</TableCell>
                      <TableCell className="text-right">
                        {mov.cargo != null ? (
                          <span className="font-medium text-status-overdue-foreground">
                            {formatCurrencyARS(mov.cargo)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {mov.pago != null ? (
                          <span className="font-medium text-status-active-foreground">
                            {formatCurrencyARS(mov.pago)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setMovimientoAEliminar(mov)}
                          aria-label="Eliminar movimiento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={pagoDialogOpen} onOpenChange={setPagoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              Ingresá el monto del pago recibido. Se permiten pagos parciales.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegistrarPago} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pago-monto">Monto</Label>
              <Input
                id="pago-monto"
                name="monto"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ej: 3000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pago-fecha">Fecha</Label>
              <Input
                id="pago-fecha"
                name="fecha"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pago-notas">Notas (opcional)</Label>
              <Textarea
                id="pago-notas"
                name="notas"
                placeholder="Ej: Pago en efectivo"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPagoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={movimientoAEliminar !== null}
        onOpenChange={(open) => {
          if (!open) setMovimientoAEliminar(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              {movimientoAEliminar && (
                <>
                  Se eliminará el {getMovimientoTipoLabel(movimientoAEliminar)}{" "}
                  <span className="font-medium text-foreground">
                    {movimientoAEliminar.concepto}
                  </span>{" "}
                  del{" "}
                  {formatDate(movimientoAEliminar.fecha)}. El saldo y el estado
                  del socio se recalcularán automáticamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleEliminarMovimiento();
              }}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={cuotaDialogOpen} onOpenChange={setCuotaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar cuota</DialogTitle>
            <DialogDescription>
              Se generará la cuota del período seleccionado según el tipo de
              socio y la tarifa vigente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="periodo-cuota">Período (YYYY-MM)</Label>
            <Input
              id="periodo-cuota"
              type="month"
              value={periodoCuota}
              onChange={(e) => setPeriodoCuota(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCuotaDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleGenerarCuota} disabled={isSubmitting}>
              {isSubmitting ? "Generando..." : "Generar cuota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
