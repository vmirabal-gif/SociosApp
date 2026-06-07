"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchCobradores } from "@/lib/cobranza/api";
import { fetchUsuarios, upsertUsuario } from "@/lib/usuarios/api";
import { roleLabels, type RolUsuario, type UsuarioPerfil } from "@/lib/types/auth";
import type { Cobrador } from "@/lib/types/cobranza";

const roles: RolUsuario[] = ["ADMINISTRADOR", "CONTADOR", "COBRADOR"];

export function UsuariosSection() {
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([]);
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<UsuarioPerfil | null>(null);
  const [rol, setRol] = useState<RolUsuario>("COBRADOR");
  const [cobradorId, setCobradorId] = useState("");
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const [users, collectors] = await Promise.all([
        fetchUsuarios(),
        fetchCobradores(),
      ]);
      setUsuarios(users);
      setCobradores(collectors);
    } catch {
      toast.error("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirNuevo = () => {
    setEditando(null);
    setRol("COBRADOR");
    setCobradorId("");
    setActivo(true);
    setDialogOpen(true);
  };

  const abrirEditar = (usuario: UsuarioPerfil) => {
    setEditando(usuario);
    setRol(usuario.rol);
    setCobradorId(usuario.cobradorId ?? "");
    setActivo(usuario.activo);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData(e.currentTarget);

    try {
      await upsertUsuario({
        id: String(form.get("id") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        nombre: String(form.get("nombre") ?? "").trim(),
        apellido: String(form.get("apellido") ?? "").trim(),
        rol,
        cobradorId: cobradorId || null,
        activo,
      });
      toast.success("Usuario guardado.");
      setDialogOpen(false);
      cargar();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo guardar el usuario."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UsersRound className="h-5 w-5" />
            Usuarios
          </CardTitle>
          <Button size="sm" className="gap-2" onClick={abrirNuevo}>
            <UserPlus className="h-4 w-4" />
            Vincular usuario
          </Button>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Primero creá el usuario en Supabase Auth. Luego vinculá su UUID con
            un rol de aplicación.
          </p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay perfiles de usuario registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      {usuario.nombre} {usuario.apellido}
                    </TableCell>
                    <TableCell>{roleLabels[usuario.rol]}</TableCell>
                    <TableCell>{usuario.activo ? "Activo" : "Inactivo"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirEditar(usuario)}
                      >
                        Editar
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
              {editando ? "Editar usuario" : "Vincular usuario"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">UUID de Supabase Auth</Label>
              <Input id="id" name="id" defaultValue={editando?.id} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={editando?.email}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" defaultValue={editando?.nombre} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  name="apellido"
                  defaultValue={editando?.apellido}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={rol} onValueChange={(v) => setRol(v as RolUsuario)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {rol === "COBRADOR" && (
              <div className="space-y-2">
                <Label>Cobrador asociado</Label>
                <Select value={cobradorId} onValueChange={setCobradorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cobrador" />
                  </SelectTrigger>
                  <SelectContent>
                    {cobradores.map((cobrador) => (
                      <SelectItem key={cobrador.id} value={cobrador.id}>
                        {cobrador.nombre} {cobrador.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch checked={activo} onCheckedChange={setActivo} />
              <Label>Activo</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
