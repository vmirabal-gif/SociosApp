"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { usePathname } from "next/navigation";
import {
  Users,
  UserPlus,
  LayoutDashboard,
  CreditCard,
  Settings,
  Wallet,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import type { RolUsuario } from "@/lib/types/auth";

const navigation = [
  { name: "Panel", href: "/", icon: LayoutDashboard, roles: ["ADMINISTRADOR"] },
  { name: "Socios", href: "/members", icon: Users, roles: ["ADMINISTRADOR"] },
  {
    name: "Nuevo Socio",
    href: "/members/new",
    icon: UserPlus,
    roles: ["ADMINISTRADOR"],
  },
  {
    name: "Pagos",
    href: "/payments",
    icon: CreditCard,
    roles: ["ADMINISTRADOR", "CONTADOR"],
  },
  {
    name: "Cobranza",
    href: "/cobranza",
    icon: Wallet,
    roles: ["ADMINISTRADOR", "CONTADOR", "COBRADOR"],
  },
  {
    name: "Rendiciones",
    href: "/cobranza/rendiciones",
    icon: ClipboardList,
    roles: ["ADMINISTRADOR", "CONTADOR", "COBRADOR"],
  },
  {
    name: "Configuración",
    href: "/settings",
    icon: Settings,
    roles: ["ADMINISTRADOR"],
  },
  {
    name: "Usuarios",
    href: "/usuarios",
    icon: ShieldCheck,
    roles: ["ADMINISTRADOR"],
  },
] satisfies {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  roles: RolUsuario[];
}[];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const visibleNavigation = navigation.filter(
    (item) => profile && item.roles.includes(profile.rol)
  );

  return (
    <aside
      className={cn(
        "flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">9J</span>
        </div>
        <span className="text-sm font-semibold leading-tight text-sidebar-foreground">Club 9 de Julio Olímpico</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNavigation.map((item) => {
          const isActive =
            item.href === "/cobranza"
              ? pathname.startsWith("/cobranza") &&
                !pathname.startsWith("/cobranza/rendiciones")
              : pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground">
          © 2024 Club 9 de Julio Olímpico de Freyre
        </p>
      </div>
    </aside>
  );
}
