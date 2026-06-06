"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { CuotasConfigSection } from "@/components/settings/cuotas-config-section";
import { GeneracionCuotasSection } from "@/components/settings/generacion-cuotas-section";

export default function SettingsPage() {
  return (
    <DashboardLayout title="Configuración" subtitle="Ajustes del sistema">
      <div className="mx-auto max-w-2xl space-y-6">
        <CuotasConfigSection />
        <GeneracionCuotasSection />
      </div>
    </DashboardLayout>
  );
}
