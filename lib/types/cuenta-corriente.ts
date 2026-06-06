import type { TipoSocio } from "@/lib/types/socios";

export type TipoMovimiento = "CARGO" | "PAGO";

export type SaldoTipo = "debe" | "al_dia" | "a_favor";

export interface MovimientoRow {
  id: string;
  socio_id: string | null;
  grupo_familiar_id: string | null;
  tipo: TipoMovimiento;
  monto: number;
  periodo: string | null;
  fecha: string;
  concepto: string;
  notas: string | null;
  configuracion_cuota_id: string | null;
  generacion_cuota_id: string | null;
  created_at: string;
}

export interface ConfiguracionCuotaRow {
  id: string;
  tipo_socio: TipoSocio;
  monto: number;
  vigente_desde: string;
  vigente_hasta: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrarPagoInput {
  monto: number;
  fecha: string;
  notas?: string;
}

export interface GeneracionMasivaDiagnostico {
  periodo: string;
  sociosEncontrados: number;
  gruposEncontrados: number;
  tarifasVigentes: Partial<Record<TipoSocio, number>>;
  creados: number;
  omitidos: number;
  generacionPreexistente: boolean;
  logs: string[];
  errorDetalle: string | null;
}

export interface GeneracionMasivaResult {
  periodo: string;
  creados: number;
  omitidos: number;
  diagnostico: GeneracionMasivaDiagnostico;
}

export class GeneracionCuotasError extends Error {
  diagnostico: GeneracionMasivaDiagnostico;

  constructor(message: string, diagnostico: GeneracionMasivaDiagnostico) {
    super(message);
    this.name = "GeneracionCuotasError";
    this.diagnostico = diagnostico;
  }
}

export interface MovimientoCuenta {
  id: string;
  fecha: string;
  concepto: string;
  cargo: number | null;
  pago: number | null;
  periodo?: string;
}

export interface SaldoCuenta {
  monto: number;
  tipo: SaldoTipo;
}

export interface CuentaCorrienteView {
  movimientos: MovimientoCuenta[];
  esGrupoFamiliar: boolean;
  nombreGrupo: string | null;
}

export interface ConfiguracionCuota {
  id?: string;
  tipoSocio: TipoSocio;
  label: string;
  monto: number;
  vigenteDesde?: string;
  vigenteHasta?: string | null;
}
