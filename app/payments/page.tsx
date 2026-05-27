"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <DashboardLayout title="Pagos" subtitle="Gestión de cuotas y pagos">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Módulo de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            El módulo de gestión de pagos estará disponible próximamente.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
