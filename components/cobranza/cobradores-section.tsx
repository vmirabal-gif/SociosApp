"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserCog, Plus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import {
  createCobrador,
  fetchCobradores,
  updateCobrador,
} from "@/lib/cobranza/api";
import type { Cobrador } from "@/lib/types/cobranza";

export function CobradoresSection() {
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Cobrador | null>(null);
  const [activo, setActivo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cargar = () => {
    setLoading(true);
    fetchCobradores()
      .then(setCobradores)
      .catch(() => toast.error("Error al cargar cobradores."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirNuevo = () => {
    setEditando(null);
    setActivo(true);
    setDialogOpen(true);
  };

  const abrirEditar = (c: Cobrador) => {
    setEditando(c);
    setActivo(c.activo);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);

    try {
      if (editando) {
        await updateCobrador({
          id: editando.id,
          nombre: String(form.get("nombre") ?? "").trim(),
          apellido: String(form.get("apellido") ?? "").trim(),
          telefono: String(form.get("telefono") ?? "").trim() || undefined,
          activo,
        });
        toast.success("Cobrador actualizado.");
      } else {
        await createCobrador({
          nombre: String(form.get("nombre") ?? "").trim(),
          apellido: String(form.get("apellido") ?? "").trim(),
          telefono: String(form.get("telefono") ?? "").trim() || undefined,
          activo,
        });
        toast.success("Cobrador creado.");
      }
      setDialogOpen(false);
      cargar();
    } catch {
      toast.error("No se pudo guardar el cobrador.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCog className="h-5 w-5" />
            Cobradores
          </CardTitle>
          <Button size="sm" className="gap-2" onClick={abrirNuevo}>
            <Plus className="h-4 w-4" />
            Nuevo cobrador
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : cobradores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay cobradores registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cobradores.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.apellido}, {c.nombre}
                    </TableCell>
                    <TableCell>{c.telefono || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={
                          c.activo
                            ? "text-status-active-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {c.activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirEditar(c)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar cobrador" : "Nuevo cobrador"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  defaultValue={editando?.nombre}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  name="apellido"
                  defaultValue={editando?.apellido}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                defaultValue={editando?.telefono}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="activo"
                checked={activo}
                onCheckedChange={setActivo}
              />
              <Label htmlFor="activo">Activo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
