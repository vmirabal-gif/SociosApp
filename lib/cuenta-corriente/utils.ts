import type { Member, TipoSocio } from "@/lib/types/socios";
import type { SaldoCuenta, SaldoTipo } from "@/lib/types/cuenta-corriente";

export interface SujetoCobro {
  socioId: string | null;
  grupoFamiliarId: string | null;
  esGrupoFamiliar: boolean;
}

export function formatCurrencyARS(amount: number): string {
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  return `$${formatted}`;
}

export function getSaldoLabel(saldo: SaldoCuenta): string {
  switch (saldo.tipo) {
    case "debe":
      return `Debe ${formatCurrencyARS(saldo.monto)}`;
    case "a_favor":
      return `Saldo a favor ${formatCurrencyARS(saldo.monto)}`;
    case "al_dia":
      return "Al día";
  }
}

export function resolverSujetoCobro(member: Member): SujetoCobro {
  if (member.memberType === "FAMILIAR" && member.familyGroupId) {
    return {
      socioId: null,
      grupoFamiliarId: member.familyGroupId,
      esGrupoFamiliar: true,
    };
  }

  return {
    socioId: member.id,
    grupoFamiliarId: null,
    esGrupoFamiliar: false,
  };
}

export function getPeriodoActual(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getPeriodoFromDate(dateString: string): string {
  const date = new Date(dateString + "T12:00:00");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const PERIODO_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidPeriodo(periodo: string): boolean {
  return PERIODO_REGEX.test(periodo);
}

/** Usa el período indicado o el mes actual como valor por defecto. */
export function resolverPeriodo(periodo?: string): string {
  const value = periodo?.trim() || getPeriodoActual();

  if (!isValidPeriodo(value)) {
    throw new Error(`Período inválido: "${value}". Usá formato YYYY-MM.`);
  }

  return value;
}

/** Alta en mes M → primera cuota en M. No genera períodos anteriores al alta. */
export function puedeGenerarCuota(fechaAlta: string, periodo: string): boolean {
  const periodoAlta = getPeriodoFromDate(fechaAlta);
  return periodo >= periodoAlta;
}

export function isSocioExento(
  estado: string,
  estadoManual: boolean
): boolean {
  return estado === "INACTIVO" && estadoManual;
}

export function getTipoTarifa(
  member: Member,
  sujeto: SujetoCobro
): TipoSocio {
  if (sujeto.esGrupoFamiliar) return "FAMILIAR";
  return member.memberType;
}

export function calcularSaldoDesdeMontos(
  totalCargos: number,
  totalPagos: number
): SaldoCuenta {
  const saldo = totalCargos - totalPagos;
  if (saldo > 0) return { monto: saldo, tipo: "debe" };
  if (saldo < 0) return { monto: Math.abs(saldo), tipo: "a_favor" };
  return { monto: 0, tipo: "al_dia" };
}

export function saldoTipoClassName(tipo: SaldoTipo): string {
  switch (tipo) {
    case "debe":
      return "text-status-overdue-foreground";
    case "a_favor":
      return "text-primary";
    case "al_dia":
      return "text-status-active-foreground";
  }
}
