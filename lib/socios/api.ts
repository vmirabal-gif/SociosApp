import { supabase } from "@/lib/supabase";
import {
  mapSocioToMember,
  type CreateGrupoFamiliarInput,
  type CreateSocioIndividualInput,
  type GrupoFamiliarRow,
  type Member,
  type SocioRow,
  type UpdateSocioInput,
} from "@/lib/types/socios";

const SOCIO_SELECT = "*, grupos_familiares(nombre)";

export async function fetchSocios(): Promise<Member[]> {
  const { data, error } = await supabase
    .from("socios")
    .select(SOCIO_SELECT)
    .order("fecha_alta", { ascending: false });

  if (error) {
    console.error("[fetchSocios] Error de Supabase:", error);
    throw error;
  }

  return (data as SocioRow[]).map(mapSocioToMember);
}

export async function fetchSocioById(id: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from("socios")
    .select(SOCIO_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[fetchSocioById] Error de Supabase:", error);
    throw error;
  }

  if (!data) return null;

  return mapSocioToMember(data as SocioRow);
}

export async function fetchGruposFamiliares(): Promise<GrupoFamiliarRow[]> {
  const { data, error } = await supabase
    .from("grupos_familiares")
    .select("id, nombre")
    .order("nombre");

  if (error) {
    console.error("[fetchGruposFamiliares] Error de Supabase:", error);
    throw error;
  }

  return (data ?? []) as GrupoFamiliarRow[];
}

export async function createSocioIndividual(
  input: CreateSocioIndividualInput
): Promise<Member> {
  const { data, error } = await supabase
    .from("socios")
    .insert({
      nombre: input.nombre,
      apellido: input.apellido,
      dni: input.dni,
      fecha_nacimiento: input.fecha_nacimiento,
      fecha_alta: input.fecha_alta,
      telefono: input.telefono ?? null,
      email: input.email ?? null,
      direccion: input.direccion ?? null,
      notas: input.notas ?? null,
      tipo_socio: "INDIVIDUAL",
    })
    .select(SOCIO_SELECT)
    .single();

  if (error) {
    console.error("[createSocioIndividual] Error de Supabase:", error);
    throw error;
  }

  return mapSocioToMember(data as SocioRow);
}

export async function createGrupoFamiliar(
  input: CreateGrupoFamiliarInput
): Promise<void> {
  const { data: grupo, error: grupoError } = await supabase
    .from("grupos_familiares")
    .insert({
      nombre: input.nombreGrupo,
      notas: input.notas ?? null,
    })
    .select("id")
    .single();

  if (grupoError) {
    console.error("[createGrupoFamiliar] Error al crear grupo:", grupoError);
    throw grupoError;
  }

  const { error: titularError } = await supabase.from("socios").insert({
    nombre: input.titular.nombre,
    apellido: input.titular.apellido,
    dni: input.titular.dni,
    fecha_nacimiento: input.titular.fecha_nacimiento,
    fecha_alta: input.titular.fecha_alta,
    telefono: input.titular.telefono,
    email: input.titular.email ?? null,
    direccion: input.titular.direccion ?? null,
    tipo_socio: "FAMILIAR",
    grupo_familiar_id: grupo.id,
    es_titular: true,
  });

  if (titularError) {
    console.error("[createGrupoFamiliar] Error al crear titular:", titularError);
    throw titularError;
  }

  if (input.integrantes.length > 0) {
    const { error: integrantesError } = await supabase.from("socios").insert(
      input.integrantes.map((integrante) => ({
        nombre: integrante.nombre,
        apellido: integrante.apellido,
        dni: integrante.dni,
        fecha_nacimiento: integrante.fecha_nacimiento,
        fecha_alta: input.titular.fecha_alta,
        telefono: integrante.telefono ?? null,
        tipo_socio: "FAMILIAR",
        grupo_familiar_id: grupo.id,
        es_titular: false,
        parentesco: integrante.parentesco,
      }))
    );

    if (integrantesError) {
      console.error(
        "[createGrupoFamiliar] Error al crear integrantes:",
        integrantesError
      );
      throw integrantesError;
    }
  }
}

export async function updateSocio(
  id: string,
  input: UpdateSocioInput,
  current: Pick<Member, "familyGroupId" | "isTitular" | "parentesco">
): Promise<Member> {
  const grupoFamiliarId = input.grupo_familiar_id;

  let esTitular = false;
  let parentesco: string | null = null;

  if (grupoFamiliarId) {
    if (
      current.familyGroupId === grupoFamiliarId &&
      current.isTitular
    ) {
      esTitular = true;
      parentesco = null;
    } else if (current.familyGroupId === grupoFamiliarId) {
      esTitular = false;
      parentesco = current.parentesco ?? "other";
    } else {
      esTitular = false;
      parentesco = "other";
    }
  }

  const { data, error } = await supabase
    .from("socios")
    .update({
      nombre: input.nombre,
      apellido: input.apellido,
      dni: input.dni,
      fecha_nacimiento: input.fecha_nacimiento,
      telefono: input.telefono ?? null,
      email: input.email ?? null,
      direccion: input.direccion ?? null,
      tipo_socio: input.tipo_socio,
      estado: input.estado,
      estado_manual: input.estado === "INACTIVO",
      fecha_alta: input.fecha_alta,
      notas: input.notas ?? null,
      grupo_familiar_id: grupoFamiliarId,
      es_titular: esTitular,
      parentesco,
    })
    .eq("id", id)
    .select(SOCIO_SELECT)
    .single();

  if (error) {
    console.error("[updateSocio] Error de Supabase:", error);
    throw error;
  }

  return mapSocioToMember(data as SocioRow);
}
