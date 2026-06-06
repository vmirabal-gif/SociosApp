import type { EstadoSocio } from "@/lib/types/socios";

export interface ConsultaEstadoInput {
  dni: string;
}

export interface SocioEstadoPublico {
  nombre: string;
  apellido: string;
  estado: EstadoSocio;
  mensajeEstado: string | null;
}

export function getMensajeEstadoPortal(estado: EstadoSocio): string | null {
  switch (estado) {
    case "ACTIVO":
      return null;
    case "MOROSO":
    case "INACTIVO":
      return "Debe regularizar su situación.";
  }
}
