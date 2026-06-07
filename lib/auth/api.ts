import { supabase } from "@/lib/supabase";
import { AUTH_ENABLED, MVP_ADMIN_PROFILE } from "@/lib/auth/config";
import {
  mapUsuarioPerfil,
  type RolUsuario,
  type UsuarioPerfil,
  type UsuarioPerfilRow,
} from "@/lib/types/auth";

export async function getCurrentProfile(): Promise<UsuarioPerfil | null> {
  if (!AUTH_ENABLED) {
    return MVP_ADMIN_PROFILE;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", authData.user.id)
    .eq("activo", true)
    .maybeSingle();

  if (error) {
    console.error("[getCurrentProfile] Error:", error);
    throw error;
  }

  return data ? mapUsuarioPerfil(data as UsuarioPerfilRow) : null;
}

export async function requireProfile(
  allowedRoles?: RolUsuario[]
): Promise<UsuarioPerfil> {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("No hay usuario autenticado o el perfil está inactivo.");
  }

  if (allowedRoles && !allowedRoles.includes(profile.rol)) {
    throw new Error("No tenés permisos para realizar esta acción.");
  }

  return profile;
}
