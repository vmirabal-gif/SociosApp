"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UserPlus, LayoutDashboard, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Panel", href: "/", icon: LayoutDashboard },
  { name: "Socios", href: "/members", icon: Users },
  { name: "Nuevo Socio", href: "/members/new", icon: UserPlus },
  { name: "Pagos", href: "/payments", icon: CreditCard },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">9J</span>
        </div>
        <span className="text-sm font-semibold leading-tight text-sidebar-foreground">Club 9 de Julio Olímpico</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
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
