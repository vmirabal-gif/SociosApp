import { supabase } from "@/lib/supabase";
import {
  getMensajeEstadoPortal,
  type ConsultaEstadoInput,
  type SocioEstadoPublico,
} from "@/lib/types/portal-socio";
import type { SocioRow } from "@/lib/types/socios";

export async function consultarEstadoSocio(
  input: ConsultaEstadoInput
): Promise<SocioEstadoPublico | null> {
  const dni = input.dni.trim();

  if (!dni) {
    return null;
  }

  const { data, error } = await supabase
    .from("socios")
    .select("nombre, apellido, estado")
    .eq("dni", dni)
    .maybeSingle();

  if (error) {
    console.error("[consultarEstadoSocio] Error de Supabase:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as Pick<SocioRow, "nombre" | "apellido" | "estado">;

  return {
    nombre: row.nombre,
    apellido: row.apellido,
    estado: row.estado,
    mensajeEstado: getMensajeEstadoPortal(row.estado),
  };
}
