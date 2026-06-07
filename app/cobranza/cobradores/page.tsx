"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { CobradoresSection } from "@/components/cobranza/cobradores-section";

export default function CobradoresPage() {
  return (
    <DashboardLayout
      title="Cobradores"
      subtitle="Gestión de personal de cobranza"
      allowedRoles={["ADMINISTRADOR"]}
    >
      <CobradoresSection />
    </DashboardLayout>
  );
}
