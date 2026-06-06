export type TipoSocio = "INDIVIDUAL" | "FAMILIAR" | "BECADO";
export type EstadoSocio = "ACTIVO" | "MOROSO" | "INACTIVO";
export type ParentescoTipo = "spouse" | "child" | "parent" | "sibling" | "other";

export interface SocioRow {
  id: string;
  numero_socio: string;
  nombre: string;
  apellido: string;
  dni: string;
  tipo_socio: TipoSocio;
  estado: EstadoSocio;
  estado_manual: boolean;
  fecha_alta: string;
  fecha_nacimiento: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  grupo_familiar_id: string | null;
  es_titular: boolean;
  parentesco: ParentescoTipo | null;
  created_at: string;
  updated_at: string;
  grupos_familiares: { nombre: string } | null;
}

export interface GrupoFamiliarRow {
  id: string;
  nombre: string;
}

export interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  dni: string;
  memberType: TipoSocio;
  familyGroup: string | null;
  familyGroupId: string | null;
  status: EstadoSocio;
  estadoManual: boolean;
  registrationDate: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isTitular: boolean;
  parentesco: ParentescoTipo | null;
}

export interface CreateSocioIndividualInput {
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  fecha_alta: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
}

export interface FamilyMemberInput {
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  parentesco: ParentescoTipo;
  telefono?: string;
}

export interface CreateGrupoFamiliarInput {
  nombreGrupo: string;
  notas?: string;
  titular: {
    nombre: string;
    apellido: string;
    dni: string;
    fecha_nacimiento: string;
    fecha_alta: string;
    telefono: string;
    email?: string;
    direccion?: string;
  };
  integrantes: FamilyMemberInput[];
}

export interface UpdateSocioInput {
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipo_socio: TipoSocio;
  estado: EstadoSocio;
  fecha_alta: string;
  notas?: string;
  grupo_familiar_id: string | null;
}

export const memberTypes = [
  { value: "INDIVIDUAL" as const, label: "Individual" },
  { value: "FAMILIAR" as const, label: "Familiar" },
  { value: "BECADO" as const, label: "Becado" },
];

export const memberStatuses = [
  { value: "ACTIVO" as const, label: "Activo" },
  { value: "MOROSO" as const, label: "Moroso" },
  { value: "INACTIVO" as const, label: "Inactivo" },
];

export function mapSocioToMember(row: SocioRow): Member {
  return {
    id: row.id,
    memberNumber: row.numero_socio,
    firstName: row.nombre,
    lastName: row.apellido,
    dni: row.dni,
    memberType: row.tipo_socio,
    familyGroup: row.grupos_familiares?.nombre ?? null,
    familyGroupId: row.grupo_familiar_id,
    status: row.estado,
    estadoManual: row.estado_manual,
    registrationDate: row.fecha_alta,
    birthDate: row.fecha_nacimiento,
    phone: row.telefono ?? "",
    email: row.email ?? "",
    address: row.direccion ?? "",
    notes: row.notas ?? "",
    isTitular: row.es_titular,
    parentesco: row.parentesco,
  };
}

function emptyToNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

export function parseIndividualForm(form: FormData): CreateSocioIndividualInput {
  return {
    nombre: String(form.get("firstName") ?? "").trim(),
    apellido: String(form.get("lastName") ?? "").trim(),
    dni: String(form.get("dni") ?? "").trim(),
    fecha_nacimiento: String(form.get("birthDate") ?? ""),
    fecha_alta: String(form.get("registrationDate") ?? ""),
    telefono: emptyToNull(form.get("phone")?.toString()) ?? undefined,
    email: emptyToNull(form.get("email")?.toString()) ?? undefined,
    direccion: emptyToNull(form.get("address")?.toString()) ?? undefined,
    notas: emptyToNull(form.get("notes")?.toString()) ?? undefined,
  };
}

export function parseFamilyForm(
  form: FormData,
  integrantes: FamilyMemberInput[]
): CreateGrupoFamiliarInput {
  return {
    nombreGrupo: String(form.get("familyName") ?? "").trim(),
    notas: emptyToNull(form.get("notes")?.toString()) ?? undefined,
    titular: {
      nombre: String(form.get("titularFirstName") ?? "").trim(),
      apellido: String(form.get("titularLastName") ?? "").trim(),
      dni: String(form.get("titularDni") ?? "").trim(),
      fecha_nacimiento: String(form.get("titularBirthDate") ?? ""),
      fecha_alta: String(form.get("registrationDate") ?? ""),
      telefono: String(form.get("titularPhone") ?? "").trim(),
      email: emptyToNull(form.get("titularEmail")?.toString()) ?? undefined,
      direccion: emptyToNull(form.get("titularAddress")?.toString()) ?? undefined,
    },
    integrantes,
  };
}
