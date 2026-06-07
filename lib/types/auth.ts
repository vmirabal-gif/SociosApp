export type RolUsuario = "ADMINISTRADOR" | "CONTADOR" | "COBRADOR";

export interface UsuarioPerfilRow {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  cobrador_id: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsuarioPerfil {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  cobradorId: string | null;
  activo: boolean;
}

export const roleLabels: Record<RolUsuario, string> = {
  ADMINISTRADOR: "Administrador",
  CONTADOR: "Contador",
  COBRADOR: "Cobrador",
};

export function mapUsuarioPerfil(row: UsuarioPerfilRow): UsuarioPerfil {
  return {
    id: row.id,
    email: row.email,
    nombre: row.nombre,
    apellido: row.apellido,
    rol: row.rol,
    cobradorId: row.cobrador_id,
    activo: row.activo,
  };
}
