import type {
  CuentaCorrienteView,
  ConfiguracionCuota,
  MovimientoCuenta,
  MovimientoRow,
  ConfiguracionCuotaRow,
} from "@/lib/types/cuenta-corriente";
import { memberTypes } from "@/lib/types/socios";
import type { Member } from "@/lib/types/socios";
import { resolverSujetoCobro } from "@/lib/cuenta-corriente/utils";

export function mapMovimientoToUI(row: MovimientoRow): MovimientoCuenta {
  return {
    id: row.id,
    fecha: row.fecha,
    concepto: row.concepto,
    cargo: row.tipo === "CARGO" ? Number(row.monto) : null,
    pago: row.tipo === "PAGO" ? Number(row.monto) : null,
    periodo: row.periodo ?? undefined,
  };
}

export function mapCuentaCorrienteView(
  member: Member,
  movimientos: MovimientoRow[]
): CuentaCorrienteView {
  const sujeto = resolverSujetoCobro(member);

  return {
    movimientos: movimientos.map(mapMovimientoToUI),
    esGrupoFamiliar: sujeto.esGrupoFamiliar,
    nombreGrupo: member.familyGroup,
  };
}

export function mapConfiguracionCuotaRow(
  row: ConfiguracionCuotaRow
): ConfiguracionCuota {
  const label =
    memberTypes.find((t) => t.value === row.tipo_socio)?.label ?? row.tipo_socio;

  return {
    id: row.id,
    tipoSocio: row.tipo_socio,
    label,
    monto: Number(row.monto),
    vigenteDesde: row.vigente_desde,
    vigenteHasta: row.vigente_hasta,
  };
}
