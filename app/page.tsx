"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertCircle } from "lucide-react";
import { fetchSocios } from "@/lib/socios/api";
import { memberTypes, type Member } from "@/lib/types/socios";
import Link from "next/link";

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetchSocios()
      .then(setMembers)
      .catch((error) => {
        console.error("[DashboardPage] Error al cargar socios:", error);
      });
  }, []);

  const activeMembers = members.filter((m) => m.status !== "INACTIVO").length;
  const upToDateMembers = members.filter((m) => m.status === "ACTIVO").length;
  const overdueMembers = members.filter((m) => m.status === "MOROSO").length;
  const distributionLabels: Record<Member["memberType"], string> = {
    INDIVIDUAL: "Individuales",
    FAMILIAR: "Familiares",
    BECADO: "Becados",
  };
  const memberTypeDistribution = memberTypes.map((type) => ({
    ...type,
    label: distributionLabels[type.value],
    count: members.filter((m) => m.memberType === type.value).length,
  }));

  const stats = [
    {
      title: "Socios Activos",
      value: activeMembers,
      icon: Users,
      description: "Socios vigentes del club",
      href: "/members",
    },
    {
      title: "Socios al día",
      value: upToDateMembers,
      icon: UserCheck,
      description: "Cuotas al día",
      href: "/members?status=ACTIVO",
    },
    {
      title: "Socios Morosos",
      value: overdueMembers,
      icon: AlertCircle,
      description: "Requieren regularización",
      href: "/members?status=MOROSO",
    },
  ];

  return (
    <DashboardLayout
      title="Panel"
      subtitle="Resumen de tu club deportivo"
      allowedRoles={["ADMINISTRADOR"]}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/members/new"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Registrar Nuevo Socio</p>
                  <p className="text-sm text-muted-foreground">Añadir un nuevo miembro</p>
                </div>
              </Link>
              <Link
                href="/members"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Ver Todos los Socios</p>
                  <p className="text-sm text-muted-foreground">Gestionar socios existentes</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Members Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Socios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {memberTypeDistribution.map((type) => (
                <div
                  key={type.value}
                  className="rounded-lg border border-border bg-primary/5 p-4"
                >
                  <p className="text-sm font-medium text-muted-foreground">
                    {type.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-card-foreground">
                    {type.count}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width:
                          members.length > 0
                            ? `${Math.round((type.count / members.length) * 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
