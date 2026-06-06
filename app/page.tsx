"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertCircle } from "lucide-react";
import { fetchSocios } from "@/lib/socios/api";
import type { Member } from "@/lib/types/socios";
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

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "ACTIVO").length;
  const overdueMembers = members.filter((m) => m.status === "MOROSO").length;

  const stats = [
    {
      title: "Total Socios",
      value: totalMembers,
      icon: Users,
      description: "Socios registrados",
      href: "/members",
    },
    {
      title: "Socios Activos",
      value: activeMembers,
      icon: UserCheck,
      description: "Al día con pagos",
      href: "/members?status=ACTIVO",
    },
    {
      title: "Morosos",
      value: overdueMembers,
      icon: AlertCircle,
      description: "Requieren atención",
      href: "/members?status=MOROSO",
    },
  ];

  const getStatusLabel = (status: Member["status"]) => {
    const labels: Record<Member["status"], string> = {
      ACTIVO: "Activo",
      MOROSO: "Moroso",
      INACTIVO: "Inactivo",
    };
    return labels[status];
  };

  return (
    <DashboardLayout title="Panel" subtitle="Resumen de tu club deportivo">
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <Link
                href="/members?status=MOROSO"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-overdue">
                  <AlertCircle className="h-5 w-5 text-status-overdue-foreground" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Revisar Morosos</p>
                  <p className="text-sm text-muted-foreground">Socios con pagos pendientes</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Members Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Socios Recientes</CardTitle>
            <Link
              href="/members"
              className="text-sm text-primary hover:underline"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay socios registrados todavía.
                </p>
              ) : (
                members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.memberNumber}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.status === "ACTIVO"
                          ? "bg-status-active text-status-active-foreground"
                          : member.status === "MOROSO"
                          ? "bg-status-overdue text-status-overdue-foreground"
                          : "bg-status-suspended text-status-suspended-foreground"
                      }`}
                    >
                      {getStatusLabel(member.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
