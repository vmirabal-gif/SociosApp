import type { MovimientoRow } from "@/lib/types/cuenta-corriente";
import type { EstadoSocio } from "@/lib/types/socios";
import { calcularSaldoDesdeMontos } from "@/lib/cuenta-corriente/utils";
import type { SaldoCuenta } from "@/lib/types/cuenta-corriente";

export function calcularSaldo(movimientos: MovimientoRow[]): SaldoCuenta {
  const totalCargos = movimientos
    .filter((m) => m.tipo === "CARGO")
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const totalPagos = movimientos
    .filter((m) => m.tipo === "PAGO")
    .reduce((sum, m) => sum + Number(m.monto), 0);

  return calcularSaldoDesdeMontos(totalCargos, totalPagos);
}

/** FIFO: cuenta cuotas mensuales con saldo pendiente > 0 */
export function contarCuotasImpagas(movimientos: MovimientoRow[]): number {
  const cargos = movimientos
    .filter((m) => m.tipo === "CARGO" && m.periodo)
    .sort((a, b) => (a.periodo ?? "").localeCompare(b.periodo ?? ""));

  const pagos = movimientos
    .filter((m) => m.tipo === "PAGO")
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const pendientes = cargos.map((c) => Number(c.monto));
  let pagoIdx = 0;
  let restantePago = 0;

  for (let i = 0; i < pendientes.length; i++) {
    let pendiente = pendientes[i];

    while (pendiente > 0 && (restantePago > 0 || pagoIdx < pagos.length)) {
      if (restantePago === 0 && pagoIdx < pagos.length) {
        restantePago = Number(pagos[pagoIdx].monto);
        pagoIdx++;
      }
      const aplicado = Math.min(pendiente, restantePago);
      pendiente -= aplicado;
      restantePago -= aplicado;
    }

    pendientes[i] = pendiente;
  }

  return pendientes.filter((p) => p > 0).length;
}

export function estadoPorCuotasImpagas(cuotasImpagas: number): EstadoSocio {
  return cuotasImpagas >= 3 ? "MOROSO" : "ACTIVO";
}
