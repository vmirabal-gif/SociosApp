"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertCircle } from "lucide-react";
import { mockMembers } from "@/lib/data";
import Link from "next/link";

export default function DashboardPage() {
  const totalMembers = mockMembers.length;
  const activeMembers = mockMembers.filter((m) => m.status === "active").length;
  const overdueMembers = mockMembers.filter((m) => m.status === "overdue").length;

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
      href: "/members?status=active",
    },
    {
      title: "Morosos",
      value: overdueMembers,
      icon: AlertCircle,
      description: "Requieren atención",
      href: "/members?status=overdue",
    },
  ];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: "Activo",
      overdue: "Moroso",
      suspended: "Suspendido",
    };
    return labels[status] ?? status;
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
                href="/members?status=overdue"
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
              {mockMembers.slice(0, 5).map((member) => (
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
                      member.status === "active"
                        ? "bg-status-active text-status-active-foreground"
                        : member.status === "overdue"
                        ? "bg-status-overdue text-status-overdue-foreground"
                        : "bg-status-suspended text-status-suspended-foreground"
                    }`}
                  >
                    {getStatusLabel(member.status)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
