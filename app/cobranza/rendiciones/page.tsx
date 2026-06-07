"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RendicionesSection } from "@/components/cobranza/rendiciones-section";
import { ArrowLeft } from "lucide-react";

export default function RendicionesPage() {
  return (
    <DashboardLayout
      title="Rendiciones"
      subtitle="Cierre y detalle de cobranza por cobrador"
      allowedRoles={["ADMINISTRADOR", "CONTADOR", "COBRADOR"]}
    >
      <Link
        href="/cobranza"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Cobranza
      </Link>
      <RendicionesSection />
    </DashboardLayout>
  );
}
