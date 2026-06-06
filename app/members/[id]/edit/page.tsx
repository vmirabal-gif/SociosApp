"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchGruposFamiliares,
  fetchSocioById,
  updateSocio,
} from "@/lib/socios/api";
import {
  memberTypes,
  memberStatuses,
  type EstadoSocio,
  type GrupoFamiliarRow,
  type Member,
  type TipoSocio,
  type UpdateSocioInput,
} from "@/lib/types/socios";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "23505"
  ) {
    return "Ya existe un socio con ese DNI.";
  }
  return "No se pudieron guardar los cambios. Intentá nuevamente.";
}

export default function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [familyGroups, setFamilyGroups] = useState<GrupoFamiliarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [status, setStatus] = useState<EstadoSocio>("ACTIVO");
  const [memberType, setMemberType] = useState<TipoSocio>("INDIVIDUAL");
  const [familyGroupId, setFamilyGroupId] = useState<string>("none");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [socio, grupos] = await Promise.all([
          fetchSocioById(id),
          fetchGruposFamiliares(),
        ]);

        if (!cancelled) {
          if (!socio) {
            setMember(null);
          } else {
            setMember(socio);
            setStatus(socio.status);
            setMemberType(socio.memberType);
            setFamilyGroupId(socio.familyGroupId ?? "none");
          }
          setFamilyGroups(grupos);
        }
      } catch {
        if (!cancelled) {
          setError("No se pudo cargar el socio.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!member) return;

    setIsSubmitting(true);

    try {
      const form = new FormData(e.currentTarget);

      const input: UpdateSocioInput = {
        nombre: String(form.get("firstName") ?? "").trim(),
        apellido: String(form.get("lastName") ?? "").trim(),
        dni: String(form.get("dni") ?? "").trim(),
        fecha_nacimiento: String(form.get("birthDate") ?? ""),
        telefono: String(form.get("phone") ?? "").trim() || undefined,
        email: String(form.get("email") ?? "").trim() || undefined,
        direccion: String(form.get("address") ?? "").trim() || undefined,
        tipo_socio: memberType,
        estado: status,
        fecha_alta: String(form.get("registrationDate") ?? ""),
        notas: String(form.get("notes") ?? "").trim() || undefined,
        grupo_familiar_id: familyGroupId === "none" ? null : familyGroupId,
      };

      await updateSocio(id, input, member);
      toast.success("Cambios guardados correctamente.");
      router.push(`/members/${id}`);
    } catch (err) {
      console.error("[EditMemberPage] Error al actualizar socio:", err);
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Editar Socio" subtitle="">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !member) {
    return (
      <DashboardLayout title="Socio No Encontrado" subtitle="">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            {error ?? "El socio que buscas no existe."}
          </p>
          <Link href="/members">
            <Button variant="outline">Volver a Socios</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Editar Socio"
      subtitle={`Editando a ${member.firstName} ${member.lastName}`}
    >
      <div className="mx-auto max-w-3xl">
        {/* Back Button */}
        <Link
          href={`/members/${member.id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Detalle
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={member.firstName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={member.lastName}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    name="dni"
                    defaultValue={member.dni}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    defaultValue={member.birthDate}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={member.phone}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={member.email}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={member.address}
                />
              </div>
            </CardContent>
          </Card>

          {/* Member Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de Membresía</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="memberNumber">Número de Socio</Label>
                  <Input
                    id="memberNumber"
                    name="memberNumber"
                    defaultValue={member.memberNumber}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as EstadoSocio)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {memberStatuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="memberType">Tipo de Socio</Label>
                  <Select
                    value={memberType}
                    onValueChange={(v) => setMemberType(v as TipoSocio)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {memberTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="familyGroup">Grupo Familiar</Label>
                  <Select value={familyGroupId} onValueChange={setFamilyGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin grupo familiar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin grupo familiar</SelectItem>
                      {familyGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDate">Fecha de Alta</Label>
                <Input
                  id="registrationDate"
                  name="registrationDate"
                  type="date"
                  defaultValue={member.registrationDate}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={member.notes}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href={`/members/${member.id}`}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
