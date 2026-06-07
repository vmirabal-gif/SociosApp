"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RegistrarPagoSection } from "@/components/cobranza/registrar-pago-section";
import { ArrowLeft } from "lucide-react";

export default function RegistrarPagoPage() {
  return (
    <DashboardLayout
      title="Registrar pago"
      subtitle="Cobranza — registro de pagos por cobrador"
      allowedRoles={["ADMINISTRADOR", "COBRADOR"]}
    >
      <Link
        href="/cobranza"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Cobranza
      </Link>
      <RegistrarPagoSection />
    </DashboardLayout>
  );
}
