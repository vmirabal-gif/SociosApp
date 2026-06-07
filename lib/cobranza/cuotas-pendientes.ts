import type { MovimientoRow } from "@/lib/types/cuenta-corriente";
import type { CuotaPendiente } from "@/lib/types/cobranza";

export function calcularCuotasConPendiente(
  movimientos: MovimientoRow[]
): CuotaPendiente[] {
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

  return cargos.map((cargo, i) => {
    const montoTotal = Number(cargo.monto);
    const montoPendiente = pendientes[i];
    const estado: CuotaPendiente["estado"] =
      cargo.estado_cuota === "PAGADA" || montoPendiente <= 0
        ? "PAGADA"
        : "PENDIENTE";

    return {
      id: cargo.id,
      periodo: cargo.periodo!,
      concepto: cargo.concepto,
      montoTotal,
      montoPendiente: Math.max(0, montoPendiente),
      estado,
    };
  });
}

export function getCuotasPendientesSeleccionables(
  movimientos: MovimientoRow[]
): CuotaPendiente[] {
  return calcularCuotasConPendiente(movimientos).filter(
    (c) => c.estado === "PENDIENTE" && c.montoPendiente > 0
  );
}
