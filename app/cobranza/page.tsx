"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DashboardCobranzaSection } from "@/components/cobranza/dashboard-cobranza";

export default function CobranzaPage() {
  return (
    <DashboardLayout
      title="Cobranza"
      subtitle="Recaudación y cobranza del club"
      allowedRoles={["ADMINISTRADOR", "CONTADOR", "COBRADOR"]}
    >
      <DashboardCobranzaSection />
    </DashboardLayout>
  );
}
