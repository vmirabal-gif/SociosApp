import { supabase } from "@/lib/supabase";
import { requireProfile } from "@/lib/auth/api";
import { recalcularEstadoMember } from "@/lib/cuenta-corriente/api";
import { resolverSujetoCobro } from "@/lib/cuenta-corriente/utils";
import {
  mapCobradorRow,
  mapRendicionRow,
  type Cobrador,
  type CobradorRow,
  type ComprobantePago,
  type CreateCobradorInput,
  type DashboardCobranza,
  type MedioPago,
  type RegistrarPagoCobranzaInput,
  type Rendicion,
  type RendicionDetallePago,
  type RendicionRow,
  type SocioBusquedaCobranza,
  type CuotaPendiente,
  type UpdateCobradorInput,
  type UltimoPagoCobranza,
} from "@/lib/types/cobranza";
import { mapSocioToMember, type Member, type SocioRow } from "@/lib/types/socios";

const SOCIO_SELECT = "*, grupos_familiares(nombre)";

// ─── Cobradores ───────────────────────────────────────────────────────────────

export async function fetchCobradores(soloActivos = false): Promise<Cobrador[]> {
  const profile = await requireProfile(["ADMINISTRADOR", "CONTADOR", "COBRADOR"]);

  if (profile.rol === "COBRADOR") {
    if (!profile.cobradorId) return [];

    const { data, error } = await supabase
      .from("cobradores")
      .select("*")
      .eq("id", profile.cobradorId)
      .eq("activo", true)
      .maybeSingle();

    if (error) throw error;
    return data ? [mapCobradorRow(data as CobradorRow)] : [];
  }

  let query = supabase
    .from("cobradores")
    .select("*")
    .order("apellido")
    .order("nombre");

  if (soloActivos) {
    query = query.eq("activo", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[fetchCobradores] Error:", error);
    throw error;
  }

  return ((data ?? []) as CobradorRow[]).map(mapCobradorRow);
}

export async function createCobrador(input: CreateCobradorInput): Promise<Cobrador> {
  await requireProfile(["ADMINISTRADOR"]);

  const { data, error } = await supabase
    .from("cobradores")
    .insert({
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      telefono: input.telefono?.trim() || null,
      activo: input.activo ?? true,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[createCobrador] Error:", error);
    throw error;
  }

  return mapCobradorRow(data as CobradorRow);
}

export async function updateCobrador(input: UpdateCobradorInput): Promise<Cobrador> {
  await requireProfile(["ADMINISTRADOR"]);

  const { data, error } = await supabase
    .from("cobradores")
    .update({
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      telefono: input.telefono?.trim() || null,
      activo: input.activo ?? true,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    console.error("[updateCobrador] Error:", error);
    throw error;
  }

  return mapCobradorRow(data as CobradorRow);
}

// ─── Búsqueda de socios ───────────────────────────────────────────────────────

export async function buscarSociosCobranza(
  query: string
): Promise<SocioBusquedaCobranza[]> {
  await requireProfile(["ADMINISTRADOR", "COBRADOR"]);

  const term = query.trim().replace(/[%_,]/g, "");
  if (term.length < 2) return [];

  const { data, error } = await supabase
    .from("socios")
    .select(SOCIO_SELECT)
    .or(
      `nombre.ilike.%${term}%,apellido.ilike.%${term}%,dni.ilike.%${term}%`
    )
    .order("apellido")
    .limit(20);

  if (error) {
    console.error("[buscarSociosCobranza] Error:", error);
    throw error;
  }

  return ((data ?? []) as SocioRow[]).map((row) => {
    const m = mapSocioToMember(row);
    return {
      id: m.id,
      nombre: m.firstName,
      apellido: m.lastName,
      dni: m.dni,
      memberNumber: m.memberNumber,
      status: m.status,
      familyGroup: m.familyGroup,
    };
  });
}

// ─── Cuotas pendientes ────────────────────────────────────────────────────────

export async function fetchCuotasPendientesSocio(
  member: Member
): Promise<CuotaPendiente[]> {
  await requireProfile(["ADMINISTRADOR", "COBRADOR"]);

  const sujeto = resolverSujetoCobro(member);

  let query = supabase
    .from("movimientos_cuenta")
    .select("id, periodo, concepto, monto, estado_cuota")
    .eq("tipo", "CARGO");

  if (sujeto.grupoFamiliarId) {
    query = query.eq("grupo_familiar_id", sujeto.grupoFamiliarId);
  } else {
    query = query.eq("socio_id", sujeto.socioId!);
  }

  const { data: cargos, error: cargosError } = await query.order("periodo");
  if (cargosError) throw cargosError;

  const cuotaIds = (cargos ?? []).map((c) => c.id);
  if (cuotaIds.length === 0) {
    return [];
  }

  const { data: pagos, error: pagosError } = await supabase
    .from("pagos")
    .select("id, cuota_id, importe")
    .in("cuota_id", cuotaIds);

  if (pagosError) throw pagosError;

  const pagoIds = (pagos ?? []).map((p) => p.id);
  const pagosRevertidos = new Set<string>();

  if (pagoIds.length > 0) {
    const { data: reversiones, error: reversionesError } = await supabase
      .from("pagos_reversiones")
      .select("pago_id")
      .in("pago_id", pagoIds);

    if (reversionesError) throw reversionesError;

    for (const reversion of reversiones ?? []) {
      pagosRevertidos.add(reversion.pago_id);
    }
  }

  const pagadoPorCuota = new Map<string, number>();
  for (const pago of pagos ?? []) {
    if (pagosRevertidos.has(pago.id)) continue;
    pagadoPorCuota.set(
      pago.cuota_id,
      (pagadoPorCuota.get(pago.cuota_id) ?? 0) + Number(pago.importe)
    );
  }

  return (cargos ?? [])
    .map((cargo): CuotaPendiente => {
      const montoTotal = Number(cargo.monto);
      const totalPagado = pagadoPorCuota.get(cargo.id) ?? 0;
      const montoPendiente = Math.max(0, montoTotal - totalPagado);
      const estado =
        montoTotal === 0 || totalPagado >= montoTotal
          ? "PAGADA"
          : "PENDIENTE";

      return {
        id: cargo.id,
        periodo: cargo.periodo ?? "—",
        concepto: cargo.concepto,
        montoTotal,
        montoPendiente,
        estado,
      };
    })
    .filter((cuota) => cuota.estado === "PENDIENTE" && cuota.montoPendiente > 0);
}

async function fetchMemberById(id: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from("socios")
    .select(SOCIO_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapSocioToMember(data as SocioRow);
}

// ─── Rendición abierta ────────────────────────────────────────────────────────

async function obtenerRendicionAbierta(cobradorId: string): Promise<string> {
  const profile = await requireProfile(["ADMINISTRADOR", "COBRADOR"]);
  if (profile.rol === "COBRADOR" && profile.cobradorId !== cobradorId) {
    throw new Error("No podés registrar pagos para otro cobrador.");
  }

  const hoy = new Date().toISOString().split("T")[0];

  const { data: existente, error: fetchError } = await supabase
    .from("rendiciones")
    .select("id")
    .eq("cobrador_id", cobradorId)
    .eq("fecha", hoy)
    .eq("estado", "ABIERTA")
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existente) return existente.id;

  const { data: nueva, error: insertError } = await supabase
    .from("rendiciones")
    .insert({ cobrador_id: cobradorId, fecha: hoy })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return nueva.id;
}

// ─── Registrar pago ───────────────────────────────────────────────────────────

export async function registrarPagoCobranza(
  input: RegistrarPagoCobranzaInput
): Promise<ComprobantePago> {
  const profile = await requireProfile(["ADMINISTRADOR", "COBRADOR"]);
  const cobradorId =
    profile.rol === "COBRADOR" ? profile.cobradorId : input.cobradorId;

  if (!cobradorId) {
    throw new Error("El usuario cobrador no tiene cobrador asociado.");
  }

  if (input.cuotaIds.length === 0) {
    throw new Error("Seleccioná al menos una cuota.");
  }

  const [member, cobrador, cuotasPendientes] = await Promise.all([
    fetchMemberById(input.socioId),
    supabase.from("cobradores").select("*").eq("id", cobradorId).single(),
    fetchMemberById(input.socioId).then((m) =>
      m ? fetchCuotasPendientesSocio(m) : []
    ),
  ]);

  if (!member) throw new Error("Socio no encontrado.");
  if (cobrador.error || !cobrador.data) throw new Error("Cobrador no encontrado.");
  if (!cobrador.data.activo) throw new Error("El cobrador no está activo.");

  const pendientesMap = new Map(cuotasPendientes.map((c) => [c.id, c]));
  const cuotasAPagar = input.cuotaIds.map((id) => {
    const cuota = pendientesMap.get(id);
    if (!cuota) throw new Error(`La cuota ${id} no está pendiente o no existe.`);
    return cuota;
  });

  const importeTotal = cuotasAPagar.reduce((s, c) => s + c.montoPendiente, 0);
  if (importeTotal <= 0) throw new Error("El importe total debe ser mayor a cero.");

  const sujeto = resolverSujetoCobro(member);
  const rendicionId = await obtenerRendicionAbierta(cobradorId);
  const ahora = new Date();
  const fechaPago = ahora.toISOString().split("T")[0];
  const conceptos = cuotasAPagar.map((c) => c.concepto).join(", ");

  const { data: movimiento, error: movError } = await supabase
    .from("movimientos_cuenta")
    .insert({
      socio_id: sujeto.socioId,
      grupo_familiar_id: sujeto.grupoFamiliarId,
      tipo: "PAGO",
      monto: importeTotal,
      fecha: fechaPago,
      concepto: `Cobranza — ${conceptos}`,
      notas: input.observaciones?.trim() || null,
    })
    .select("id")
    .single();

  if (movError) {
    console.error("[registrarPagoCobranza] Error movimiento:", movError);
    throw movError;
  }

  const pagoIds: string[] = [];

  for (const cuota of cuotasAPagar) {
    const { data: pago, error: pagoError } = await supabase
      .from("pagos")
      .insert({
        socio_id: input.socioId,
        cuota_id: cuota.id,
        cobrador_id: cobradorId,
        rendicion_id: rendicionId,
        movimiento_pago_id: movimiento.id,
        fecha_hora_pago: ahora.toISOString(),
        importe: cuota.montoPendiente,
        medio_pago: input.medioPago,
        observaciones: input.observaciones?.trim() || null,
      })
      .select("id")
      .single();

    if (pagoError) {
      console.error("[registrarPagoCobranza] Error pago:", pagoError);
      throw pagoError;
    }

    pagoIds.push(pago.id);
    // estado_cuota se sincroniza automáticamente vía trigger en BD (trg_pagos_after_insert_sync_cuota)
  }

  await recalcularEstadoMember(member);

  const cob = cobrador.data as CobradorRow;

  return {
    pagoIds,
    socioNombre: member.firstName,
    socioApellido: member.lastName,
    dni: member.dni,
    telefono: member.phone,
    items: cuotasAPagar.map((c) => ({
      concepto: c.concepto,
      periodo: c.periodo,
      importe: c.montoPendiente,
    })),
    importeTotal,
    fechaHora: ahora.toISOString(),
    cobradorNombre: cob.nombre,
    cobradorApellido: cob.apellido,
    medioPago: input.medioPago,
    observaciones: input.observaciones?.trim() || null,
  };
}

// ─── Rendiciones ──────────────────────────────────────────────────────────────

export async function fetchRendiciones(): Promise<Rendicion[]> {
  const profile = await requireProfile(["ADMINISTRADOR", "CONTADOR", "COBRADOR"]);

  let query = supabase
    .from("rendiciones")
    .select("*, cobradores(nombre, apellido)")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (profile.rol === "COBRADOR") {
    if (!profile.cobradorId) return [];
    query = query.eq("cobrador_id", profile.cobradorId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const rendiciones = (data ?? []) as RendicionRow[];
  const result: Rendicion[] = [];

  for (const row of rendiciones) {
    const { data: pagosRendicion } = await supabase
      .from("pagos")
      .select("importe")
      .eq("rendicion_id", row.id);

    const cantidad = pagosRendicion?.length ?? 0;
    const totalVivo = (pagosRendicion ?? []).reduce(
      (s, p) => s + Number(p.importe),
      0
    );

    const mapped = mapRendicionRow(row, cantidad);
    if (row.estado === "ABIERTA") {
      mapped.totalRendido = totalVivo;
    }
    result.push(mapped);
  }

  return result;
}

export async function fetchDetalleRendicion(
  rendicionId: string
): Promise<RendicionDetallePago[]> {
  const profile = await requireProfile(["ADMINISTRADOR", "CONTADOR", "COBRADOR"]);

  if (profile.rol === "COBRADOR") {
    if (!profile.cobradorId) return [];
    const { data: rendicion, error: rendicionError } = await supabase
      .from("rendiciones")
      .select("id")
      .eq("id", rendicionId)
      .eq("cobrador_id", profile.cobradorId)
      .maybeSingle();

    if (rendicionError) throw rendicionError;
    if (!rendicion) throw new Error("No tenés permisos para ver esta rendición.");
  }

  const { data, error } = await supabase
    .from("pagos")
    .select("id, importe, fecha_hora_pago, cuota_id, socios(nombre, apellido)")
    .eq("rendicion_id", rendicionId)
    .order("fecha_hora_pago", { ascending: false });

  if (error) throw error;

  const detalle: RendicionDetallePago[] = [];
  for (const p of data ?? []) {
    const { data: cuota } = await supabase
      .from("movimientos_cuenta")
      .select("concepto, periodo")
      .eq("id", p.cuota_id)
      .maybeSingle();

    const socio = p.socios as { nombre: string; apellido: string } | null;
    detalle.push({
      id: p.id,
      socioNombre: socio?.nombre ?? "—",
      socioApellido: socio?.apellido ?? "",
      cuotaConcepto: cuota?.concepto ?? "Cuota",
      cuotaPeriodo: cuota?.periodo ?? "—",
      importe: Number(p.importe),
      fechaHora: p.fecha_hora_pago,
    });
  }
  return detalle;
}

export async function cerrarRendicion(
  rendicionId: string,
  observaciones?: string
): Promise<void> {
  await requireProfile(["ADMINISTRADOR"]);

  const { data: pagos, error: pagosError } = await supabase
    .from("pagos")
    .select("importe")
    .eq("rendicion_id", rendicionId);

  if (pagosError) throw pagosError;

  const total = (pagos ?? []).reduce((s, p) => s + Number(p.importe), 0);

  const { error } = await supabase
    .from("rendiciones")
    .update({
      estado: "CERRADA",
      fecha_cierre: new Date().toISOString(),
      total_rendido: total,
      observaciones: observaciones?.trim() || null,
    })
    .eq("id", rendicionId)
    .eq("estado", "ABIERTA");

  if (error) {
    console.error("[cerrarRendicion] Error:", error);
    throw error;
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboardCobranza(): Promise<DashboardCobranza> {
  const profile = await requireProfile(["ADMINISTRADOR", "CONTADOR", "COBRADOR"]);
  const ahora = new Date();
  const hoy = ahora.toISOString().split("T")[0];
  const inicioMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-01`;

  let pagosQuery = supabase
    .from("pagos")
    .select(
      "id, importe, fecha_hora_pago, medio_pago, cobrador_id, cuota_id, cobradores(nombre, apellido), socios(nombre, apellido)"
    )
    .order("fecha_hora_pago", { ascending: false });

  if (profile.rol === "COBRADOR") {
    if (!profile.cobradorId) {
      return {
        totalHoy: 0,
        totalMes: 0,
        cantidadPagosHoy: 0,
        cantidadPagosMes: 0,
        porCobrador: [],
        porPeriodo: [],
        ultimosPagos: [],
      };
    }
    pagosQuery = pagosQuery.eq("cobrador_id", profile.cobradorId);
  }

  const { data: pagos, error } = await pagosQuery;

  if (error) throw error;

  const cuotaIds = [...new Set((pagos ?? []).map((p) => p.cuota_id))];
  const cuotaMap = new Map<string, { concepto: string; periodo: string }>();

  if (cuotaIds.length > 0) {
    const { data: cuotas } = await supabase
      .from("movimientos_cuenta")
      .select("id, concepto, periodo")
      .in("id", cuotaIds);

    for (const c of cuotas ?? []) {
      cuotaMap.set(c.id, { concepto: c.concepto, periodo: c.periodo ?? "—" });
    }
  }

  const parsed = (pagos ?? []).map((p) => {
    const cobrador = p.cobradores as { nombre: string; apellido: string } | null;
    const socio = p.socios as { nombre: string; apellido: string } | null;
    const cuota = cuotaMap.get(p.cuota_id);
    return {
      id: p.id as string,
      importe: Number(p.importe),
      fechaHora: p.fecha_hora_pago as string,
      cobradorId: p.cobrador_id as string,
      cobradorNombre: cobrador ? `${cobrador.nombre} ${cobrador.apellido}` : "—",
      socioNombre: socio?.nombre ?? "—",
      socioApellido: socio?.apellido ?? "",
      medioPago: p.medio_pago as MedioPago,
      periodo: cuota?.periodo ?? "—",
      concepto: cuota?.concepto ?? "Pago",
    };
  });

  const pagosHoy = parsed.filter((p) => p.fechaHora.startsWith(hoy));
  const pagosMes = parsed.filter((p) => p.fechaHora >= inicioMes);

  const cobradorMap = new Map<string, { nombre: string; total: number; cantidad: number }>();
  for (const p of pagosMes) {
    const prev = cobradorMap.get(p.cobradorId) ?? {
      nombre: p.cobradorNombre,
      total: 0,
      cantidad: 0,
    };
    prev.total += p.importe;
    prev.cantidad += 1;
    cobradorMap.set(p.cobradorId, prev);
  }

  const periodoMap = new Map<string, { total: number; cantidad: number }>();
  for (const p of pagosMes) {
    const prev = periodoMap.get(p.periodo) ?? { total: 0, cantidad: 0 };
    prev.total += p.importe;
    prev.cantidad += 1;
    periodoMap.set(p.periodo, prev);
  }

  return {
    totalHoy: pagosHoy.reduce((s, p) => s + p.importe, 0),
    totalMes: pagosMes.reduce((s, p) => s + p.importe, 0),
    cantidadPagosHoy: pagosHoy.length,
    cantidadPagosMes: pagosMes.length,
    porCobrador: Array.from(cobradorMap.entries()).map(([id, v]) => ({
      cobradorId: id,
      cobradorNombre: v.nombre,
      total: v.total,
      cantidad: v.cantidad,
    })),
    porPeriodo: Array.from(periodoMap.entries())
      .map(([periodo, v]) => ({ periodo, total: v.total, cantidad: v.cantidad }))
      .sort((a, b) => b.periodo.localeCompare(a.periodo)),
    ultimosPagos: parsed.slice(0, 15).map(
      (p): UltimoPagoCobranza => ({
        id: p.id,
        fechaHora: p.fechaHora,
        socioNombre: p.socioNombre,
        socioApellido: p.socioApellido,
        cobradorNombre: p.cobradorNombre,
        importe: p.importe,
        medioPago: p.medioPago,
        concepto: p.concepto,
      })
    ),
  };
}
