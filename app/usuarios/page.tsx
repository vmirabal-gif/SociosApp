"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { UsuariosSection } from "@/components/usuarios/usuarios-section";

export default function UsuariosPage() {
  return (
    <DashboardLayout
      title="Usuarios"
      subtitle="Roles y permisos del sistema"
      allowedRoles={["ADMINISTRADOR"]}
    >
      <UsuariosSection />
    </DashboardLayout>
  );
}
