"use client";

import { use, useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CuentaCorrienteSection } from "@/components/members/cuenta-corriente-section";
import { fetchSocioById } from "@/lib/socios/api";
import { fetchCuentaCorriente } from "@/lib/cuenta-corriente/api";
import {
  formatCurrencyARS,
  getSaldoLabel,
  saldoTipoClassName,
} from "@/lib/cuenta-corriente/utils";
import type { CuentaCorrienteView, SaldoCuenta } from "@/lib/types/cuenta-corriente";
import { memberTypes, type Member } from "@/lib/types/socios";
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";

export default function MemberDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [member, setMember] = useState<Member | null>(null);
  const [cuenta, setCuenta] = useState<CuentaCorrienteView | null>(null);
  const [saldo, setSaldo] = useState<SaldoCuenta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const socio = await fetchSocioById(id);
      if (!socio) {
        setMember(null);
        setCuenta(null);
        setSaldo(null);
        return;
      }

      const cc = await fetchCuentaCorriente(socio);
      setMember(socio);
      setCuenta(cc.cuenta);
      setSaldo(cc.saldo);
    } catch {
      setError("No se pudo cargar el socio.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    try {
      const socio = await fetchSocioById(id);
      if (!socio) return;

      const cc = await fetchCuentaCorriente(socio);
      setMember(socio);
      setCuenta(cc.cuenta);
      setSaldo(cc.saldo);
    } catch {
      setError("No se pudo actualizar la información.");
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T12:00:00").toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getMemberTypeLabel = (type: Member["memberType"]) => {
    return memberTypes.find((t) => t.value === type)?.label ?? type;
  };

  if (loading) {
    return (
      <DashboardLayout title="Cargando..." subtitle="">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !member || !cuenta || !saldo) {
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
      title={`${member.firstName} ${member.lastName}`}
      subtitle={member.memberNumber}
    >
      <div className="mx-auto max-w-4xl">
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
          <div className="lg:col-span-2 space-y-6">
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

          <div className="space-y-6">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Finanzas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Saldo</span>
                  <span
                    className={`flex items-center gap-1 text-sm font-medium ${saldoTipoClassName(saldo.tipo)}`}
                  >
                    <CreditCard className="h-4 w-4" />
                    {saldo.tipo === "debe"
                      ? formatCurrencyARS(saldo.monto)
                      : getSaldoLabel(saldo)}
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

        <div className="mt-6">
          <CuentaCorrienteSection
            member={member}
            cuenta={cuenta}
            saldo={saldo}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
