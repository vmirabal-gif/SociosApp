"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Wallet } from "lucide-react";

export default function PaymentsPage() {
  return (
    <DashboardLayout
      title="Pagos"
      subtitle="Gestión de cuotas y pagos"
      allowedRoles={["ADMINISTRADOR", "CONTADOR"]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagos administrativos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Los pagos manuales por socio siguen disponibles en el detalle de
              cada socio (Cuenta Corriente).
            </p>
            <p className="text-muted-foreground">
              Para cobranza en calle por cobradores, usá el módulo de Cobranza.
            </p>
            <Link href="/cobranza/registrar">
              <Button variant="outline" className="gap-2">
                <Wallet className="h-4 w-4" />
                Ir a Cobranza
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
