import { supabase } from "@/lib/supabase";
import { requireProfile } from "@/lib/auth/api";
import {
  calcularSaldo,
  contarCuotasImpagas,
  estadoPorCuotasImpagas,
} from "@/lib/cuenta-corriente/saldo";
import {
  mapConfiguracionCuotaRow,
  mapCuentaCorrienteView,
} from "@/lib/cuenta-corriente/mappers";
import {
  getTipoTarifa,
  resolverPeriodo,
  isSocioExento,
  puedeGenerarCuota,
  resolverSujetoCobro,
  type SujetoCobro,
} from "@/lib/cuenta-corriente/utils";
import type {
  ConfiguracionCuota,
  CuentaCorrienteView,
  MovimientoRow,
  RegistrarPagoInput,
  GeneracionMasivaResult,
  GeneracionMasivaDiagnostico,
  ConfiguracionCuotaRow,
  SaldoCuenta,
} from "@/lib/types/cuenta-corriente";
import { GeneracionCuotasError } from "@/lib/types/cuenta-corriente";
import type { Member, SocioRow, TipoSocio } from "@/lib/types/socios";

function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

export function formatSupabaseError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return String(error ?? "Error desconocido");
  }

  const err = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  const parts = [
    err.message,
    err.code ? `código: ${err.code}` : null,
    err.details ? `detalle: ${err.details}` : null,
    err.hint ? `hint: ${err.hint}` : null,
  ].filter(Boolean);

  return parts.join(" | ") || "Error de Supabase";
}

function crearDiagnostico(periodo: string): GeneracionMasivaDiagnostico {
  return {
    periodo,
    sociosEncontrados: 0,
    gruposEncontrados: 0,
    tarifasVigentes: {},
    creados: 0,
    omitidos: 0,
    generacionPreexistente: false,
    logs: [],
    errorDetalle: null,
  };
}

function logDiag(diag: GeneracionMasivaDiagnostico, mensaje: string): void {
  diag.logs.push(mensaje);
  console.log(`[generarCuotasMasivas] ${mensaje}`);
}

async function fetchMovimientosPorSujeto(
  sujeto: SujetoCobro
): Promise<MovimientoRow[]> {
  let query = supabase
    .from("movimientos_cuenta")
    .select("*")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (sujeto.grupoFamiliarId) {
    query = query.eq("grupo_familiar_id", sujeto.grupoFamiliarId);
  } else if (sujeto.socioId) {
    query = query.eq("socio_id", sujeto.socioId);
  } else {
    return [];
  }

  const { data, error } = await query;

  if (error) {
    console.error("[fetchMovimientosPorSujeto] Error:", error);
    throw error;
  }

  return (data ?? []) as MovimientoRow[];
}

export async function fetchCuentaCorriente(
  member: Member
): Promise<{ cuenta: CuentaCorrienteView; saldo: SaldoCuenta }> {
  const sujeto = resolverSujetoCobro(member);
  const movimientos = await fetchMovimientosPorSujeto(sujeto);
  const cuenta = mapCuentaCorrienteView(member, movimientos);
  const saldo = calcularSaldo(movimientos);

  return { cuenta, saldo };
}

export async function fetchConfiguracionCuotas(): Promise<ConfiguracionCuota[]> {
  const { data, error } = await supabase
    .from("configuracion_cuotas")
    .select("*")
    .is("vigente_hasta", null)
    .order("tipo_socio");

  if (error) {
    console.error("[fetchConfiguracionCuotas] Error:", error);
    throw error;
  }

  return ((data ?? []) as ConfiguracionCuotaRow[]).map(mapConfiguracionCuotaRow);
}

async function fetchTarifasVigentesMap(): Promise<
  Record<TipoSocio, { id: string; monto: number }>
> {
  const cuotas = await fetchConfiguracionCuotas();
  const map = {} as Record<TipoSocio, { id: string; monto: number }>;

  for (const cuota of cuotas) {
    map[cuota.tipoSocio] = { id: cuota.id!, monto: cuota.monto };
  }

  return map;
}

export async function updateConfiguracionCuotas(
  cuotas: Pick<ConfiguracionCuota, "tipoSocio" | "monto">[]
): Promise<ConfiguracionCuota[]> {
  await requireProfile(["ADMINISTRADOR"]);

  const vigentes = await fetchConfiguracionCuotas();
  const hoy = new Date().toISOString().split("T")[0];

  for (const cuota of cuotas) {
    const vigente = vigentes.find((v) => v.tipoSocio === cuota.tipoSocio);
    if (!vigente || vigente.monto === cuota.monto) continue;

    const { error: closeError } = await supabase
      .from("configuracion_cuotas")
      .update({ vigente_hasta: hoy })
      .eq("id", vigente.id);

    if (closeError) {
      console.error("[updateConfiguracionCuotas] Error al cerrar tarifa:", closeError);
      throw closeError;
    }

    const { error: insertError } = await supabase
      .from("configuracion_cuotas")
      .insert({
        tipo_socio: cuota.tipoSocio,
        monto: cuota.monto,
        vigente_desde: hoy,
      });

    if (insertError) {
      console.error("[updateConfiguracionCuotas] Error al crear tarifa:", insertError);
      throw insertError;
    }
  }

  return fetchConfiguracionCuotas();
}

async function recalcularEstadoPorSujeto(sujeto: SujetoCobro): Promise<void> {
  const movimientos = await fetchMovimientosPorSujeto(sujeto);
  const cuotasImpagas = contarCuotasImpagas(movimientos);
  const nuevoEstado = estadoPorCuotasImpagas(cuotasImpagas);

  if (sujeto.grupoFamiliarId) {
    const { error } = await supabase
      .from("socios")
      .update({ estado: nuevoEstado })
      .eq("grupo_familiar_id", sujeto.grupoFamiliarId)
      .eq("estado_manual", false);

    if (error) {
      console.error("[recalcularEstadoPorSujeto] Error grupo:", error);
      throw error;
    }
  } else if (sujeto.socioId) {
    const { error } = await supabase
      .from("socios")
      .update({ estado: nuevoEstado })
      .eq("id", sujeto.socioId)
      .eq("estado_manual", false);

    if (error) {
      console.error("[recalcularEstadoPorSujeto] Error socio:", error);
      throw error;
    }
  }
}

export async function recalcularEstadoMember(member: Member): Promise<void> {
  const sujeto = resolverSujetoCobro(member);
  await recalcularEstadoPorSujeto(sujeto);
}

async function insertCargo(params: {
  socioId: string | null;
  grupoFamiliarId: string | null;
  monto: number;
  periodo: string;
  configuracionCuotaId: string;
  generacionCuotaId?: string | null;
}): Promise<"created" | "skipped"> {
  const concepto = `Cuota ${params.periodo}`;

  const { error } = await supabase.from("movimientos_cuenta").insert({
    socio_id: params.socioId,
    grupo_familiar_id: params.grupoFamiliarId,
    tipo: "CARGO",
    monto: params.monto,
    periodo: params.periodo,
    concepto,
    estado_cuota: "PENDIENTE",
    configuracion_cuota_id: params.configuracionCuotaId,
    generacion_cuota_id: params.generacionCuotaId ?? null,
  });

  if (error) {
    if (isUniqueViolation(error)) return "skipped";
    console.error("[insertCargo] Error:", error);
    throw error;
  }

  return "created";
}

export async function registrarPago(
  member: Member,
  input: RegistrarPagoInput
): Promise<void> {
  await requireProfile(["ADMINISTRADOR"]);

  const sujeto = resolverSujetoCobro(member);
  const concepto = input.notas?.trim()
    ? `Pago — ${input.notas.trim()}`
    : "Pago";

  const { error } = await supabase.from("movimientos_cuenta").insert({
    socio_id: sujeto.socioId,
    grupo_familiar_id: sujeto.grupoFamiliarId,
    tipo: "PAGO",
    monto: input.monto,
    fecha: input.fecha,
    concepto,
    notas: input.notas?.trim() || null,
  });

  if (error) {
    console.error("[registrarPago] Error:", error);
    throw error;
  }

  await recalcularEstadoPorSujeto(sujeto);
}

export async function generarCuotaIndividual(
  member: Member,
  periodoInput?: string
): Promise<{
  result: "created" | "skipped" | "not_eligible";
  periodo: string;
}> {
  await requireProfile(["ADMINISTRADOR"]);

  const periodo = resolverPeriodo(periodoInput);
  const sujeto = resolverSujetoCobro(member);

  if (member.estadoManual && member.status === "INACTIVO") {
    return { result: "not_eligible", periodo };
  }

  let fechaAlta = member.registrationDate;

  if (sujeto.esGrupoFamiliar && sujeto.grupoFamiliarId) {
    const { data: titular, error } = await supabase
      .from("socios")
      .select("fecha_alta")
      .eq("grupo_familiar_id", sujeto.grupoFamiliarId)
      .eq("es_titular", true)
      .maybeSingle();

    if (error) {
      console.error("[generarCuotaIndividual] Error titular:", error);
      throw error;
    }

    if (!titular) return { result: "not_eligible", periodo };
    fechaAlta = titular.fecha_alta;
  }

  if (!puedeGenerarCuota(fechaAlta, periodo)) {
    return { result: "not_eligible", periodo };
  }

  const tarifas = await fetchTarifasVigentesMap();
  const tipoTarifa = getTipoTarifa(member, sujeto);
  const tarifa = tarifas[tipoTarifa];

  if (!tarifa) {
    throw new Error(`No hay tarifa vigente para ${tipoTarifa}`);
  }

  const result = await insertCargo({
    socioId: sujeto.socioId,
    grupoFamiliarId: sujeto.grupoFamiliarId,
    monto: tarifa.monto,
    periodo,
    configuracionCuotaId: tarifa.id,
  });

  if (result === "created") {
    await recalcularEstadoPorSujeto(sujeto);
  }

  return { result, periodo };
}

export async function eliminarMovimiento(
  member: Member,
  movimientoId: string
): Promise<void> {
  await requireProfile(["ADMINISTRADOR"]);

  const sujeto = resolverSujetoCobro(member);

  const { data: movimiento, error: fetchError } = await supabase
    .from("movimientos_cuenta")
    .select("id, socio_id, grupo_familiar_id")
    .eq("id", movimientoId)
    .maybeSingle();

  if (fetchError) {
    console.error("[eliminarMovimiento] Error al buscar:", fetchError);
    throw fetchError;
  }

  if (!movimiento) {
    throw new Error("Movimiento no encontrado.");
  }

  const pertenece =
    (sujeto.socioId && movimiento.socio_id === sujeto.socioId) ||
    (sujeto.grupoFamiliarId &&
      movimiento.grupo_familiar_id === sujeto.grupoFamiliarId);

  if (!pertenece) {
    throw new Error("El movimiento no pertenece a esta cuenta corriente.");
  }

  const { error: deleteError } = await supabase
    .from("movimientos_cuenta")
    .delete()
    .eq("id", movimientoId);

  if (deleteError) {
    console.error("[eliminarMovimiento] Error al eliminar:", deleteError);
    throw deleteError;
  }

  await recalcularEstadoPorSujeto(sujeto);
}

export async function generarCuotasMasivas(
  periodoInput?: string
): Promise<GeneracionMasivaResult> {
  await requireProfile(["ADMINISTRADOR"]);

  const periodo = resolverPeriodo(periodoInput);
  const diag = crearDiagnostico(periodo);

  logDiag(diag, `Inicio — período ${periodo}`);

  try {
    const { data: existente, error: checkError } = await supabase
      .from("generaciones_cuotas")
      .select("id, cargos_creados, cargos_omitidos")
      .eq("periodo", periodo)
      .maybeSingle();

    if (checkError) {
      diag.errorDetalle = formatSupabaseError(checkError);
      logDiag(diag, `ERROR verificación generaciones_cuotas: ${diag.errorDetalle}`);
      throw new GeneracionCuotasError(diag.errorDetalle, diag);
    }

    if (existente) {
      diag.generacionPreexistente = true;
      logDiag(
        diag,
        `Registro existente para ${periodo}: creados=${existente.cargos_creados}, omitidos=${existente.cargos_omitidos}`
      );

      if (existente.cargos_creados > 0) {
        const msg = `Ya se generaron cuotas para el período ${periodo} (${existente.cargos_creados} creadas, ${existente.cargos_omitidos} omitidas).`;
        diag.errorDetalle = msg;
        throw new GeneracionCuotasError(msg, diag);
      }

      const { error: deletePrevError } = await supabase
        .from("generaciones_cuotas")
        .delete()
        .eq("id", existente.id);

      if (deletePrevError) {
        diag.errorDetalle = formatSupabaseError(deletePrevError);
        logDiag(diag, `ERROR al eliminar ejecución vacía previa: ${diag.errorDetalle}`);
        throw new GeneracionCuotasError(diag.errorDetalle, diag);
      }

      logDiag(
        diag,
        "Ejecución previa sin cuotas creadas eliminada — se permite reintento."
      );
    }

    const tarifas = await fetchTarifasVigentesMap();
    diag.tarifasVigentes = {
      INDIVIDUAL: tarifas.INDIVIDUAL?.monto,
      FAMILIAR: tarifas.FAMILIAR?.monto,
      BECADO: tarifas.BECADO?.monto,
    };
    logDiag(
      diag,
      `Tarifas vigentes: INDIVIDUAL=${tarifas.INDIVIDUAL?.monto ?? "N/A"}, FAMILIAR=${tarifas.FAMILIAR?.monto ?? "N/A"}, BECADO=${tarifas.BECADO?.monto ?? "N/A"}`
    );

    if (!tarifas.INDIVIDUAL || !tarifas.FAMILIAR || !tarifas.BECADO) {
      const msg = "Faltan tarifas vigentes en configuracion_cuotas.";
      diag.errorDetalle = msg;
      logDiag(diag, `ERROR: ${msg}`);
      throw new GeneracionCuotasError(msg, diag);
    }

    let creados = 0;
    let omitidos = 0;

    const { data: socios, error: sociosError } = await supabase
      .from("socios")
      .select("*")
      .in("tipo_socio", ["INDIVIDUAL", "BECADO"]);

    if (sociosError) {
      diag.errorDetalle = formatSupabaseError(sociosError);
      logDiag(diag, `ERROR consulta socios: ${diag.errorDetalle}`);
      throw new GeneracionCuotasError(diag.errorDetalle, diag);
    }

    diag.sociosEncontrados = socios?.length ?? 0;
    logDiag(diag, `Socios INDIVIDUAL/BECADO encontrados: ${diag.sociosEncontrados}`);

    for (const socio of (socios ?? []) as SocioRow[]) {
      if (isSocioExento(socio.estado, socio.estado_manual)) {
        omitidos++;
        logDiag(
          diag,
          `Omitido ${socio.nombre} ${socio.apellido}: inactivo manual`
        );
        continue;
      }

      if (!puedeGenerarCuota(socio.fecha_alta, periodo)) {
        omitidos++;
        logDiag(
          diag,
          `Omitido ${socio.nombre} ${socio.apellido}: alta ${socio.fecha_alta} posterior al período ${periodo}`
        );
        continue;
      }

      const tarifa = tarifas[socio.tipo_socio];
      if (!tarifa) {
        omitidos++;
        logDiag(
          diag,
          `Omitido ${socio.nombre} ${socio.apellido}: sin tarifa ${socio.tipo_socio}`
        );
        continue;
      }

      const result = await insertCargo({
        socioId: socio.id,
        grupoFamiliarId: null,
        monto: tarifa.monto,
        periodo,
        configuracionCuotaId: tarifa.id,
      });

      if (result === "created") {
        creados++;
        logDiag(
          diag,
          `Creada cuota ${periodo} para ${socio.nombre} ${socio.apellido} ($${tarifa.monto})`
        );
      } else {
        omitidos++;
        logDiag(
          diag,
          `Omitido ${socio.nombre} ${socio.apellido}: duplicado UNIQUE período ${periodo}`
        );
      }
    }

    const { data: grupos, error: gruposError } = await supabase
      .from("grupos_familiares")
      .select("id");

    if (gruposError) {
      diag.errorDetalle = formatSupabaseError(gruposError);
      logDiag(diag, `ERROR consulta grupos: ${diag.errorDetalle}`);
      throw new GeneracionCuotasError(diag.errorDetalle, diag);
    }

    diag.gruposEncontrados = grupos?.length ?? 0;
    logDiag(diag, `Grupos familiares encontrados: ${diag.gruposEncontrados}`);

    for (const grupo of grupos ?? []) {
    const { data: miembros, error: miembrosError } = await supabase
      .from("socios")
      .select("*")
      .eq("grupo_familiar_id", grupo.id);

    if (miembrosError) {
      console.error("[generarCuotasMasivas] Error miembros:", miembrosError);
      throw miembrosError;
    }

    const lista = (miembros ?? []) as SocioRow[];

      if (lista.every((m) => isSocioExento(m.estado, m.estado_manual))) {
        omitidos++;
        logDiag(diag, `Omitido grupo ${grupo.id}: todos inactivos manuales`);
        continue;
      }

      const titular = lista.find((m) => m.es_titular);
      if (!titular || !puedeGenerarCuota(titular.fecha_alta, periodo)) {
        omitidos++;
        logDiag(
          diag,
          `Omitido grupo ${grupo.id}: titular alta ${titular?.fecha_alta ?? "sin titular"}`
        );
        continue;
      }

      const tarifa = tarifas.FAMILIAR;
      if (!tarifa) {
        omitidos++;
        logDiag(diag, `Omitido grupo ${grupo.id}: sin tarifa FAMILIAR`);
        continue;
      }

      const result = await insertCargo({
        socioId: null,
        grupoFamiliarId: grupo.id,
        monto: tarifa.monto,
        periodo,
        configuracionCuotaId: tarifa.id,
      });

      if (result === "created") {
        creados++;
        logDiag(
          diag,
          `Creada cuota ${periodo} para grupo ${grupo.id} ($${tarifa.monto})`
        );
      } else {
        omitidos++;
        logDiag(
          diag,
          `Omitido grupo ${grupo.id}: duplicado UNIQUE período ${periodo}`
        );
      }
    }

    diag.creados = creados;
    diag.omitidos = omitidos;
    logDiag(diag, `Resumen: ${creados} creadas, ${omitidos} omitidas`);

    const { data: generacion, error: genError } = await supabase
      .from("generaciones_cuotas")
      .insert({
        periodo,
        cargos_creados: creados,
        cargos_omitidos: omitidos,
      })
      .select("id")
      .single();

    if (genError) {
      diag.errorDetalle = formatSupabaseError(genError);
      if (isUniqueViolation(genError)) {
        diag.errorDetalle = `Ya se generaron cuotas para el período ${periodo}. (${diag.errorDetalle})`;
      }
      logDiag(diag, `ERROR INSERT generaciones_cuotas: ${diag.errorDetalle}`);
      throw new GeneracionCuotasError(diag.errorDetalle, diag);
    }

    const generacionId = generacion.id;
    logDiag(diag, `Registro generaciones_cuotas creado: ${generacionId}`);

    if (creados > 0) {
      const { error: linkError } = await supabase
        .from("movimientos_cuenta")
        .update({ generacion_cuota_id: generacionId })
        .eq("periodo", periodo)
        .eq("tipo", "CARGO")
        .is("generacion_cuota_id", null);

      if (linkError) {
        diag.errorDetalle = formatSupabaseError(linkError);
        logDiag(diag, `ERROR vincular movimientos: ${diag.errorDetalle}`);
        throw new GeneracionCuotasError(diag.errorDetalle, diag);
      }
    }

    const { data: sociosRecalc, error: recalcError } = await supabase
      .from("socios")
      .select("id, grupo_familiar_id, tipo_socio, estado_manual")
      .eq("estado_manual", false);

    if (recalcError) {
      diag.errorDetalle = formatSupabaseError(recalcError);
      logDiag(diag, `ERROR recalcular estados: ${diag.errorDetalle}`);
      throw new GeneracionCuotasError(diag.errorDetalle, diag);
    }

    const gruposProcesados = new Set<string>();
    for (const socio of sociosRecalc ?? []) {
      if (socio.tipo_socio === "FAMILIAR" && socio.grupo_familiar_id) {
        if (gruposProcesados.has(socio.grupo_familiar_id)) continue;
        gruposProcesados.add(socio.grupo_familiar_id);
        await recalcularEstadoPorSujeto({
          socioId: null,
          grupoFamiliarId: socio.grupo_familiar_id,
          esGrupoFamiliar: true,
        });
      } else {
        await recalcularEstadoPorSujeto({
          socioId: socio.id,
          grupoFamiliarId: null,
          esGrupoFamiliar: false,
        });
      }
    }

    logDiag(diag, "Finalizado correctamente.");
    return { periodo, creados, omitidos, diagnostico: diag };
  } catch (error) {
    if (error instanceof GeneracionCuotasError) {
      throw error;
    }

    diag.errorDetalle = formatSupabaseError(error);
    logDiag(diag, `ERROR inesperado: ${diag.errorDetalle}`);
    console.error("[generarCuotasMasivas] Error inesperado:", error);
    throw new GeneracionCuotasError(diag.errorDetalle, diag);
  }
}

export async function fetchSaldosPorMiembros(
  members: Member[]
): Promise<Record<string, SaldoCuenta>> {
  const socioIds = new Set<string>();
  const grupoIds = new Set<string>();

  for (const member of members) {
    const sujeto = resolverSujetoCobro(member);
    if (sujeto.grupoFamiliarId) {
      grupoIds.add(sujeto.grupoFamiliarId);
    } else if (sujeto.socioId) {
      socioIds.add(sujeto.socioId);
    }
  }

  const saldosPorSocio: Record<string, SaldoCuenta> = {};
  const saldosPorGrupo: Record<string, SaldoCuenta> = {};

  if (socioIds.size > 0) {
    const { data, error } = await supabase
      .from("movimientos_cuenta")
      .select("*")
      .in("socio_id", Array.from(socioIds));

    if (error) {
      console.error("[fetchSaldosPorMiembros] Error socios:", error);
      throw error;
    }

    const porSocio = new Map<string, MovimientoRow[]>();
    for (const mov of (data ?? []) as MovimientoRow[]) {
      if (!mov.socio_id) continue;
      const lista = porSocio.get(mov.socio_id) ?? [];
      lista.push(mov);
      porSocio.set(mov.socio_id, lista);
    }

    for (const [id, movs] of porSocio) {
      saldosPorSocio[id] = calcularSaldo(movs);
    }
  }

  if (grupoIds.size > 0) {
    const { data, error } = await supabase
      .from("movimientos_cuenta")
      .select("*")
      .in("grupo_familiar_id", Array.from(grupoIds));

    if (error) {
      console.error("[fetchSaldosPorMiembros] Error grupos:", error);
      throw error;
    }

    const porGrupo = new Map<string, MovimientoRow[]>();
    for (const mov of (data ?? []) as MovimientoRow[]) {
      if (!mov.grupo_familiar_id) continue;
      const lista = porGrupo.get(mov.grupo_familiar_id) ?? [];
      lista.push(mov);
      porGrupo.set(mov.grupo_familiar_id, lista);
    }

    for (const [id, movs] of porGrupo) {
      saldosPorGrupo[id] = calcularSaldo(movs);
    }
  }

  const result: Record<string, SaldoCuenta> = {};

  for (const member of members) {
    const sujeto = resolverSujetoCobro(member);
    if (sujeto.grupoFamiliarId) {
      result[member.id] =
        saldosPorGrupo[sujeto.grupoFamiliarId] ?? { monto: 0, tipo: "al_dia" };
    } else if (sujeto.socioId) {
      result[member.id] =
        saldosPorSocio[sujeto.socioId] ?? { monto: 0, tipo: "al_dia" };
    } else {
      result[member.id] = { monto: 0, tipo: "al_dia" };
    }
  }

  return result;
}
