"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, UserPlus, Users, Trash2, Crown } from "lucide-react";
import Link from "next/link";
import { createGrupoFamiliar, createSocioIndividual } from "@/lib/socios/api";
import {
  parseFamilyForm,
  parseIndividualForm,
  type FamilyMemberInput,
  type ParentescoTipo,
} from "@/lib/types/socios";

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  relationship: string;
  phone: string;
}

const relationshipOptions = [
  { value: "spouse", label: "Cónyuge" },
  { value: "child", label: "Hijo/a" },
  { value: "parent", label: "Padre/Madre" },
  { value: "sibling", label: "Hermano/a" },
  { value: "other", label: "Otro" },
];

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "23505"
  ) {
    return "Ya existe un socio con ese DNI o número de socio.";
  }
  return "No se pudo guardar el socio. Intentá nuevamente.";
}

export default function NewMemberPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  const handleSubmitIndividual = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = new FormData(e.currentTarget);
      await createSocioIndividual(parseIndividualForm(form));
      toast.success("Socio registrado correctamente.");
      router.push("/members");
    } catch (error) {
      console.error("[NewMemberPage] Error al guardar socio individual:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFamily = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const integrantesSinParentesco = familyMembers.filter(
        (m) => !m.relationship
      );
      if (integrantesSinParentesco.length > 0) {
        toast.error("Todos los integrantes deben tener un parentesco asignado.");
        setIsSubmitting(false);
        return;
      }

      const integrantes: FamilyMemberInput[] = familyMembers.map((m) => ({
        nombre: m.firstName.trim(),
        apellido: m.lastName.trim(),
        dni: m.dni.trim(),
        fecha_nacimiento: m.birthDate,
        parentesco: m.relationship as ParentescoTipo,
        telefono: m.phone.trim() || undefined,
      }));

      const form = new FormData(e.currentTarget);
      await createGrupoFamiliar(parseFamilyForm(form, integrantes));
      toast.success("Grupo familiar registrado correctamente.");
      router.push("/members");
    } catch (error) {
      console.error("[NewMemberPage] Error al guardar grupo familiar:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFamilyMember = () => {
    setFamilyMembers([
      ...familyMembers,
      {
        id: crypto.randomUUID(),
        firstName: "",
        lastName: "",
        dni: "",
        birthDate: "",
        relationship: "",
        phone: "",
      },
    ]);
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter((m) => m.id !== id));
  };

  const updateFamilyMember = (id: string, field: keyof FamilyMember, value: string) => {
    setFamilyMembers(
      familyMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  return (
    <DashboardLayout
      title="Nuevo Socio"
      subtitle="Registrar un nuevo socio del club"
      allowedRoles={["ADMINISTRADOR"]}
    >
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          href="/members"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Socios
        </Link>

        <Tabs defaultValue="individual" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="individual" className="gap-1 text-xs sm:gap-2 sm:text-sm">
              <UserPlus className="h-4 w-4" />
              Socio Individual
            </TabsTrigger>
            <TabsTrigger value="family" className="gap-1 text-xs sm:gap-2 sm:text-sm">
              <Users className="h-4 w-4" />
              Grupo Familiar
            </TabsTrigger>
          </TabsList>

          {/* Individual Member Tab */}
          <TabsContent value="individual">
            <form onSubmit={handleSubmitIndividual} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ind-firstName">Nombre</Label>
                      <Input
                        id="ind-firstName"
                        name="firstName"
                        placeholder="Ingresa el nombre"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ind-lastName">Apellido</Label>
                      <Input
                        id="ind-lastName"
                        name="lastName"
                        placeholder="Ingresa el apellido"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ind-dni">DNI</Label>
                      <Input
                        id="ind-dni"
                        name="dni"
                        placeholder="Ej: 12345678"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ind-birthDate">Fecha de Nacimiento</Label>
                      <Input
                        id="ind-birthDate"
                        name="birthDate"
                        type="date"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ind-phone">Teléfono</Label>
                      <Input
                        id="ind-phone"
                        name="phone"
                        type="tel"
                        placeholder="+54 11 1234 5678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ind-email">Correo Electrónico</Label>
                      <Input
                        id="ind-email"
                        name="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ind-address">Dirección</Label>
                    <Input
                      id="ind-address"
                      name="address"
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ind-registrationDate">Fecha de Alta</Label>
                    <Input
                      id="ind-registrationDate"
                      name="registrationDate"
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ind-notes">Observaciones</Label>
                    <Textarea
                      id="ind-notes"
                      name="notes"
                      placeholder="Notas adicionales sobre el socio..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href="/members">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Guardando..." : "Guardar Socio"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Family Group Tab */}
          <TabsContent value="family">
            <form onSubmit={handleSubmitFamily} className="space-y-6">
              {/* Family Group Name */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Grupo Familiar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="familyName">Nombre del Grupo Familiar</Label>
                    <Input
                      id="familyName"
                      name="familyName"
                      placeholder="Ej: Familia García"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Titular Member */}
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="h-5 w-5 text-primary" />
                    Socio Titular
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="titular-firstName">Nombre</Label>
                      <Input
                        id="titular-firstName"
                        name="titularFirstName"
                        placeholder="Ingresa el nombre"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="titular-lastName">Apellido</Label>
                      <Input
                        id="titular-lastName"
                        name="titularLastName"
                        placeholder="Ingresa el apellido"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="titular-dni">DNI</Label>
                      <Input
                        id="titular-dni"
                        name="titularDni"
                        placeholder="Ej: 12345678"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="titular-birthDate">Fecha de Nacimiento</Label>
                      <Input
                        id="titular-birthDate"
                        name="titularBirthDate"
                        type="date"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="titular-phone">Teléfono</Label>
                      <Input
                        id="titular-phone"
                        name="titularPhone"
                        type="tel"
                        placeholder="+54 11 1234 5678"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="titular-email">Correo Electrónico</Label>
                      <Input
                        id="titular-email"
                        name="titularEmail"
                        type="email"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titular-address">Dirección</Label>
                    <Input
                      id="titular-address"
                      name="titularAddress"
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titular-registrationDate">Fecha de Alta</Label>
                    <Input
                      id="titular-registrationDate"
                      name="registrationDate"
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Family Members List */}
              {familyMembers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Integrantes ({familyMembers.length})
                  </h3>
                  {familyMembers.map((member, index) => (
                    <Card key={member.id}>
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base">
                          Integrante {index + 1}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFamilyMember(member.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input
                              value={member.firstName}
                              onChange={(e) =>
                                updateFamilyMember(member.id, "firstName", e.target.value)
                              }
                              placeholder="Ingresa el nombre"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Apellido</Label>
                            <Input
                              value={member.lastName}
                              onChange={(e) =>
                                updateFamilyMember(member.id, "lastName", e.target.value)
                              }
                              placeholder="Ingresa el apellido"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-2">
                            <Label>DNI</Label>
                            <Input
                              value={member.dni}
                              onChange={(e) =>
                                updateFamilyMember(member.id, "dni", e.target.value)
                              }
                              placeholder="Ej: 12345678"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fecha de Nacimiento</Label>
                            <Input
                              type="date"
                              value={member.birthDate}
                              onChange={(e) =>
                                updateFamilyMember(member.id, "birthDate", e.target.value)
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Parentesco</Label>
                            <Select
                              value={member.relationship}
                              onValueChange={(value) =>
                                updateFamilyMember(member.id, "relationship", value)
                              }
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {relationshipOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Teléfono (opcional)</Label>
                          <Input
                            type="tel"
                            value={member.phone}
                            onChange={(e) =>
                              updateFamilyMember(member.id, "phone", e.target.value)
                            }
                            placeholder="+54 11 1234 5678"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add Member Button */}
              <Button
                type="button"
                variant="outline"
                onClick={addFamilyMember}
                className="w-full gap-2 border-dashed"
              >
                <UserPlus className="h-4 w-4" />
                Agregar Integrante
              </Button>

              {/* Observations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="family-notes"
                    name="notes"
                    placeholder="Notas adicionales sobre el grupo familiar..."
                    rows={3}
                  />
                </CardContent>
              </Card>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href="/members">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Guardando..." : "Guardar Grupo Familiar"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
