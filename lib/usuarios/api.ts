import { supabase } from "@/lib/supabase";
import { requireProfile } from "@/lib/auth/api";
import {
  mapUsuarioPerfil,
  type RolUsuario,
  type UsuarioPerfil,
  type UsuarioPerfilRow,
} from "@/lib/types/auth";

export interface UpsertUsuarioInput {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  cobradorId?: string | null;
  activo: boolean;
}

export async function fetchUsuarios(): Promise<UsuarioPerfil[]> {
  await requireProfile(["ADMINISTRADOR"]);

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("email");

  if (error) throw error;
  return ((data ?? []) as UsuarioPerfilRow[]).map(mapUsuarioPerfil);
}

export async function upsertUsuario(
  input: UpsertUsuarioInput
): Promise<UsuarioPerfil> {
  await requireProfile(["ADMINISTRADOR"]);

  const { data, error } = await supabase
    .from("usuarios")
    .upsert({
      id: input.id,
      email: input.email.trim(),
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      rol: input.rol,
      cobrador_id: input.rol === "COBRADOR" ? input.cobradorId ?? null : null,
      activo: input.activo,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapUsuarioPerfil(data as UsuarioPerfilRow);
}
