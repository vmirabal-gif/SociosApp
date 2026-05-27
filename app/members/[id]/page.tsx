"use client";

import { use } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockMembers, memberTypes } from "@/lib/data";
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";

export default function MemberDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const member = mockMembers.find((m) => m.id === id);

  if (!member) {
    return (
      <DashboardLayout title="Socio No Encontrado" subtitle="">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            El socio que buscas no existe.
          </p>
          <Link href="/members">
            <Button variant="outline">Volver a Socios</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getMemberTypeLabel = (type: typeof member.memberType) => {
    return memberTypes.find((t) => t.value === type)?.label ?? type;
  };

  return (
    <DashboardLayout
      title={`${member.firstName} ${member.lastName}`}
      subtitle={member.memberNumber}
    >
      <div className="mx-auto max-w-4xl">
        {/* Back Button and Actions */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Socios
          </Link>
          <Link href={`/members/${member.id}/edit`}>
            <Button className="gap-2">
              <Pencil className="h-4 w-4" />
              Editar Socio
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre Completo</p>
                    <p className="font-medium text-card-foreground">
                      {member.firstName} {member.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">DNI</p>
                    <p className="font-medium text-card-foreground">{member.dni}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                    <p className="font-medium text-card-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(member.birthDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium text-card-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {member.phone || "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Correo Electrónico</p>
                  <p className="font-medium text-card-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {member.email || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium text-card-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {member.address || "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {member.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-card-foreground">{member.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de Membresía</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <StatusBadge status={member.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    {getMemberTypeLabel(member.memberType)}
                  </span>
                </div>
                {member.familyGroup && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Grupo Familiar</span>
                    <span className="text-sm font-medium text-card-foreground">
                      {member.familyGroup}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Finanzas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deuda Actual</span>
                  <span
                    className={`flex items-center gap-1 font-medium ${
                      member.currentDebt > 0
                        ? "text-status-overdue-foreground"
                        : "text-status-active-foreground"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    {formatCurrency(member.currentDebt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Socio Desde</span>
                  <span className="text-sm font-medium text-card-foreground">
                    {formatDate(member.registrationDate)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
