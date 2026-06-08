"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { RoleGuard } from "@/components/auth/role-guard";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar className="hidden md:flex" />

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 gap-0 p-0">
            <SheetTitle className="sr-only">Navegación principal</SheetTitle>
            <Sidebar
              className="h-full border-r-0"
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header
            title={title}
            subtitle={subtitle}
            onMenuClick={() => setMobileMenuOpen(true)}
          />
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
