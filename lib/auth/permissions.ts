import type { RolUsuario } from "@/lib/types/auth";

export const ADMIN: RolUsuario = "ADMINISTRADOR";
export const CONTADOR: RolUsuario = "CONTADOR";
export const COBRADOR: RolUsuario = "COBRADOR";

export const allRoles: RolUsuario[] = [ADMIN, CONTADOR, COBRADOR];

export function hasRole(
  currentRole: RolUsuario | null | undefined,
  allowedRoles?: RolUsuario[]
): boolean {
  if (!currentRole) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(currentRole);
}

export function canSeeGeneralReports(role: RolUsuario | null | undefined) {
  return role === ADMIN || role === CONTADOR;
}

export function canCloseRendiciones(role: RolUsuario | null | undefined) {
  return role === ADMIN;
}

export function canManageCobradores(role: RolUsuario | null | undefined) {
  return role === ADMIN;
}

export function canAccessSettings(role: RolUsuario | null | undefined) {
  return role === ADMIN;
}

export function canRegisterCobranza(role: RolUsuario | null | undefined) {
  return role === ADMIN || role === COBRADOR;
}
