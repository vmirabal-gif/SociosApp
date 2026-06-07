import type { EstadoSocio } from "@/lib/types/socios";

export type MedioPago = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "OTRO";
export type EstadoCuota = "PENDIENTE" | "PAGADA";
export type EstadoRendicion = "ABIERTA" | "CERRADA";

export interface CobradorRow {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cobrador {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  activo: boolean;
}

export interface CreateCobradorInput {
  nombre: string;
  apellido: string;
  telefono?: string;
  activo?: boolean;
}

export interface UpdateCobradorInput extends CreateCobradorInput {
  id: string;
}

export interface CuotaPendiente {
  id: string;
  periodo: string;
  concepto: string;
  montoTotal: number;
  montoPendiente: number;
  estado: EstadoCuota;
}

export interface SocioBusquedaCobranza {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  memberNumber: string;
  status: EstadoSocio;
  familyGroup: string | null;
}

export interface RegistrarPagoCobranzaInput {
  cobradorId: string;
  socioId: string;
  cuotaIds: string[];
  medioPago: MedioPago;
  observaciones?: string;
}

export interface ComprobantePagoItem {
  concepto: string;
  periodo: string;
  importe: number;
}

export interface ComprobantePago {
  pagoIds: string[];
  socioNombre: string;
  socioApellido: string;
  dni: string;
  telefono: string;
  items: ComprobantePagoItem[];
  importeTotal: number;
  fechaHora: string;
  cobradorNombre: string;
  cobradorApellido: string;
  medioPago: MedioPago;
  observaciones: string | null;
}

export interface PagoRow {
  id: string;
  socio_id: string;
  cuota_id: string;
  cobrador_id: string;
  rendicion_id: string | null;
  movimiento_pago_id: string | null;
  fecha_hora_pago: string;
  importe: number;
  medio_pago: MedioPago;
  observaciones: string | null;
  created_at: string;
}

export interface RendicionRow {
  id: string;
  cobrador_id: string;
  fecha: string;
  estado: EstadoRendicion;
  fecha_cierre: string | null;
  total_rendido: number;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  cobradores?: { nombre: string; apellido: string } | null;
}

export interface Rendicion {
  id: string;
  cobradorId: string;
  cobradorNombre: string;
  fecha: string;
  estado: EstadoRendicion;
  fechaCierre: string | null;
  totalRendido: number;
  observaciones: string | null;
  cantidadPagos: number;
}

export interface RendicionDetallePago {
  id: string;
  socioNombre: string;
  socioApellido: string;
  cuotaConcepto: string;
  cuotaPeriodo: string;
  importe: number;
  fechaHora: string;
}

export interface DashboardCobranza {
  totalHoy: number;
  totalMes: number;
  cantidadPagosHoy: number;
  cantidadPagosMes: number;
  porCobrador: { cobradorId: string; cobradorNombre: string; total: number; cantidad: number }[];
  porPeriodo: { periodo: string; total: number; cantidad: number }[];
  ultimosPagos: UltimoPagoCobranza[];
}

export interface UltimoPagoCobranza {
  id: string;
  fechaHora: string;
  socioNombre: string;
  socioApellido: string;
  cobradorNombre: string;
  importe: number;
  medioPago: MedioPago;
  concepto: string;
}

export const mediosPago: { value: MedioPago; label: string }[] = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "OTRO", label: "Otro" },
];

export function mapCobradorRow(row: CobradorRow): Cobrador {
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    telefono: row.telefono ?? "",
    activo: row.activo,
  };
}

export function mapRendicionRow(
  row: RendicionRow,
  cantidadPagos = 0
): Rendicion {
  return {
    id: row.id,
    cobradorId: row.cobrador_id,
    cobradorNombre: row.cobradores
      ? `${row.cobradores.nombre} ${row.cobradores.apellido}`
      : "—",
    fecha: row.fecha,
    estado: row.estado,
    fechaCierre: row.fecha_cierre,
    totalRendido: Number(row.total_rendido),
    observaciones: row.observaciones,
    cantidadPagos,
  };
}
