"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { RoleGuard } from "@/components/auth/role-guard";
import type { RolUsuario } from "@/lib/types/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  allowedRoles?: RolUsuario[];
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  allowedRoles,
}: DashboardLayoutProps) {
  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header title={title} subtitle={subtitle} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
