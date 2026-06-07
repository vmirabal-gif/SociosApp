"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function SchedulePage() {
  return (
    <DashboardLayout
      title="Horarios"
      subtitle="Gestión de horarios y reservas"
      allowedRoles={["ADMINISTRADOR"]}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Módulo de Horarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            El módulo de gestión de horarios estará disponible próximamente.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
