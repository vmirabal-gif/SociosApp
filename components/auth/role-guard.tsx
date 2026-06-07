"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { AUTH_ENABLED } from "@/lib/auth/config";
import { hasRole } from "@/lib/auth/permissions";
import type { RolUsuario } from "@/lib/types/auth";

interface RoleGuardProps {
  allowedRoles?: RolUsuario[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { session, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    if (!loading && !session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, router, session]);

  if (!AUTH_ENABLED) {
    return <>{children}</>;
  }

  if (loading || (!session && typeof window !== "undefined")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando sesión...</p>
      </div>
    );
  }

  if (!session) return null;

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardContent className="space-y-4 pt-6 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium">Usuario sin perfil activo</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu usuario existe en Supabase Auth, pero no tiene un registro
                activo en la tabla usuarios.
              </p>
            </div>
            <Button variant="outline" onClick={signOut}>
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasRole(profile.rol, allowedRoles)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardContent className="space-y-3 pt-6 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
            <p className="font-medium">No tenés permisos para acceder.</p>
            <p className="text-sm text-muted-foreground">
              Esta sección no está disponible para tu rol.
            </p>
            <Button variant="outline" onClick={() => router.push("/cobranza")}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
