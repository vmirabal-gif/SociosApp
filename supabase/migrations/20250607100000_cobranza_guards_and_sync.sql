-- =============================================================================
-- Club 9 de Julio Olímpico de Freyre — Cobranza: inmutabilidad y sync estado_cuota
-- Ejecutar DESPUÉS de 20250607000000_cobranza_module.sql
--
-- • pagos: inmutable (sin UPDATE ni DELETE)
-- • pagos_reversiones: corrección de errores sin mutar el pago original
-- • estado_cuota: sincronizado automáticamente al insertar pago o reversión
-- =============================================================================

-- =============================================================================
-- 1. Tabla: pagos_reversiones (corrección sin mutar pagos)
-- =============================================================================

CREATE TABLE public.pagos_reversiones (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pago_id           uuid        NOT NULL REFERENCES public.pagos (id)
                                  ON DELETE RESTRICT,
  motivo            text        NOT NULL,
  fecha_reversion   timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pagos_reversiones_motivo_no_vacio
    CHECK (char_length(trim(motivo)) > 0),

  CONSTRAINT pagos_reversiones_pago_unico
    UNIQUE (pago_id)
);

COMMENT ON TABLE public.pagos_reversiones IS
  'Anula un pago registrado por error. No modifica la fila en pagos. Dispara recálculo de estado_cuota.';

CREATE INDEX idx_pagos_reversiones_pago
  ON public.pagos_reversiones (pago_id);

-- =============================================================================
-- 2. Inmutabilidad de pagos
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_pagos_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'Los registros de pagos son inmutables. Para corregir un error, registre una reversión en pagos_reversiones.';
END;
$$;

COMMENT ON FUNCTION public.prevent_pagos_mutation IS
  'Bloquea UPDATE y DELETE sobre public.pagos.';

CREATE TRIGGER trg_pagos_no_update
  BEFORE UPDATE ON public.pagos
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_pagos_mutation();

CREATE TRIGGER trg_pagos_no_delete
  BEFORE DELETE ON public.pagos
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_pagos_mutation();

-- =============================================================================
-- 3. Sincronización automática de estado_cuota
-- =============================================================================

CREATE OR REPLACE FUNCTION public.calcular_total_vigente_cuota(p_cuota_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(p.importe), 0)
  FROM public.pagos p
  WHERE p.cuota_id = p_cuota_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.pagos_reversiones r
      WHERE r.pago_id = p.id
    );
$$;

COMMENT ON FUNCTION public.calcular_total_vigente_cuota IS
  'Suma importes de pagos vigentes (no revertidos) aplicados a una cuota (CARGO).';

CREATE OR REPLACE FUNCTION public.sync_estado_cuota(p_cuota_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_monto_cuota numeric;
  v_total_pagado  numeric;
  v_nuevo_estado  public.estado_cuota;
BEGIN
  SELECT m.monto
  INTO v_monto_cuota
  FROM public.movimientos_cuenta m
  WHERE m.id = p_cuota_id
    AND m.tipo = 'CARGO';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_total_pagado := public.calcular_total_vigente_cuota(p_cuota_id);

  IF v_monto_cuota = 0 OR v_total_pagado >= v_monto_cuota THEN
    v_nuevo_estado := 'PAGADA';
  ELSE
    v_nuevo_estado := 'PENDIENTE';
  END IF;

  UPDATE public.movimientos_cuenta
  SET estado_cuota = v_nuevo_estado
  WHERE id = p_cuota_id
    AND tipo = 'CARGO';
END;
$$;

COMMENT ON FUNCTION public.sync_estado_cuota IS
  'Actualiza estado_cuota del CARGO según pagos vigentes. PAGADA si monto cubierto; si no, PENDIENTE.';

CREATE OR REPLACE FUNCTION public.trg_pagos_sync_estado_cuota()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.sync_estado_cuota(NEW.cuota_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pagos_after_insert_sync_cuota
  AFTER INSERT ON public.pagos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_pagos_sync_estado_cuota();

CREATE OR REPLACE FUNCTION public.trg_reversion_sync_estado_cuota()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_cuota_id uuid;
BEGIN
  SELECT cuota_id
  INTO v_cuota_id
  FROM public.pagos
  WHERE id = NEW.pago_id;

  IF v_cuota_id IS NOT NULL THEN
    PERFORM public.sync_estado_cuota(v_cuota_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pagos_reversion_after_insert_sync_cuota
  AFTER INSERT ON public.pagos_reversiones
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reversion_sync_estado_cuota();

-- =============================================================================
-- 4. Backfill: alinear estado_cuota con pagos existentes
-- =============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id
    FROM public.movimientos_cuenta
    WHERE tipo = 'CARGO'
  LOOP
    PERFORM public.sync_estado_cuota(r.id);
  END LOOP;
END;
$$;

-- =============================================================================
-- Verificación
-- =============================================================================
--
-- UPDATE public.pagos SET importe = 1 WHERE false;  -- debe fallar si hay filas
--
-- SELECT proname FROM pg_proc
-- WHERE proname IN (
--   'prevent_pagos_mutation',
--   'sync_estado_cuota',
--   'calcular_total_vigente_cuota'
-- );
