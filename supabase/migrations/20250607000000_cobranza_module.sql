-- =============================================================================
-- Club 9 de Julio Olímpico de Freyre — Módulo Cobranza y Rendiciones
-- Ejecutar DESPUÉS de 20250606000000_cuenta_corriente.sql
--
-- Modelo:
--   • cuota_id → movimientos_cuenta.id (tipo = CARGO)
--   • pagos → registro de cobranza por cobrador, vinculado a movimiento PAGO
--   • rendiciones → cierre diario por cobrador
--   • estado_cuota en CARGO: PENDIENTE | PAGADA
-- =============================================================================

-- =============================================================================
-- 1. Enums
-- =============================================================================

CREATE TYPE public.estado_cuota AS ENUM (
  'PENDIENTE',
  'PAGADA'
);

CREATE TYPE public.medio_pago AS ENUM (
  'EFECTIVO',
  'TRANSFERENCIA',
  'TARJETA',
  'OTRO'
);

CREATE TYPE public.estado_rendicion AS ENUM (
  'ABIERTA',
  'CERRADA'
);

-- =============================================================================
-- 2. Alteración: movimientos_cuenta.estado_cuota
-- =============================================================================

ALTER TABLE public.movimientos_cuenta
  ADD COLUMN IF NOT EXISTS estado_cuota public.estado_cuota;

UPDATE public.movimientos_cuenta
SET estado_cuota = 'PAGADA'
WHERE tipo = 'CARGO' AND monto = 0;

UPDATE public.movimientos_cuenta
SET estado_cuota = 'PENDIENTE'
WHERE tipo = 'CARGO' AND estado_cuota IS NULL;

ALTER TABLE public.movimientos_cuenta
  ADD CONSTRAINT movimientos_cuenta_cargo_requiere_estado
    CHECK (tipo <> 'CARGO' OR estado_cuota IS NOT NULL);

COMMENT ON COLUMN public.movimientos_cuenta.estado_cuota IS
  'Solo para CARGO (cuota). PENDIENTE o PAGADA. Sincronizado automáticamente por trigger (ver 20250607100000_cobranza_guards_and_sync.sql).';

-- =============================================================================
-- 3. Tabla: cobradores
-- =============================================================================

CREATE TABLE public.cobradores (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text        NOT NULL,
  apellido    text        NOT NULL,
  telefono    text,
  activo      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT cobradores_nombre_no_vacio
    CHECK (char_length(trim(nombre)) > 0),

  CONSTRAINT cobradores_apellido_no_vacio
    CHECK (char_length(trim(apellido)) > 0)
);

COMMENT ON TABLE public.cobradores IS
  'Personal de cobranza que registra pagos de socios.';

CREATE INDEX idx_cobradores_activo
  ON public.cobradores (activo)
  WHERE activo = true;

-- =============================================================================
-- 4. Tabla: rendiciones
-- =============================================================================

CREATE TABLE public.rendiciones (
  id              uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  cobrador_id     uuid                    NOT NULL REFERENCES public.cobradores (id)
                                                  ON DELETE RESTRICT,
  fecha           date                    NOT NULL DEFAULT CURRENT_DATE,
  estado          public.estado_rendicion NOT NULL DEFAULT 'ABIERTA',
  fecha_cierre    timestamptz,
  total_rendido   numeric(12, 2)          NOT NULL DEFAULT 0,
  observaciones   text,
  created_at      timestamptz             NOT NULL DEFAULT now(),
  updated_at      timestamptz             NOT NULL DEFAULT now(),

  CONSTRAINT rendiciones_total_no_negativo
    CHECK (total_rendido >= 0),

  CONSTRAINT rendiciones_cierre_coherente
    CHECK (
      (estado = 'ABIERTA' AND fecha_cierre IS NULL)
      OR
      (estado = 'CERRADA' AND fecha_cierre IS NOT NULL)
    )
);

COMMENT ON TABLE public.rendiciones IS
  'Rendición diaria de cobranza por cobrador. Una abierta por cobrador y día.';

-- Solo una rendición ABIERTA por cobrador por día
CREATE UNIQUE INDEX idx_rendiciones_abierta_unica
  ON public.rendiciones (cobrador_id, fecha)
  WHERE estado = 'ABIERTA';

CREATE INDEX idx_rendiciones_cobrador_fecha
  ON public.rendiciones (cobrador_id, fecha DESC);

CREATE INDEX idx_rendiciones_estado
  ON public.rendiciones (estado);

-- =============================================================================
-- 5. Tabla: pagos (cobranza)
-- =============================================================================

CREATE TABLE public.pagos (
  id                  uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id            uuid              NOT NULL REFERENCES public.socios (id)
                                          ON DELETE RESTRICT,
  cuota_id            uuid              NOT NULL REFERENCES public.movimientos_cuenta (id)
                                          ON DELETE RESTRICT,
  cobrador_id         uuid              NOT NULL REFERENCES public.cobradores (id)
                                          ON DELETE RESTRICT,
  rendicion_id        uuid              REFERENCES public.rendiciones (id)
                                          ON DELETE SET NULL,
  movimiento_pago_id  uuid              REFERENCES public.movimientos_cuenta (id)
                                          ON DELETE SET NULL,
  fecha_hora_pago     timestamptz       NOT NULL DEFAULT now(),
  importe             numeric(12, 2)    NOT NULL,
  medio_pago          public.medio_pago NOT NULL DEFAULT 'EFECTIVO',
  observaciones       text,
  created_at          timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT pagos_importe_positivo
    CHECK (importe > 0)
);

COMMENT ON TABLE public.pagos IS
  'Pagos registrados por cobradores. cuota_id = movimiento CARGO. Inmutable tras creación.';

COMMENT ON COLUMN public.pagos.cuota_id IS
  'Referencia al CARGO (cuota) en movimientos_cuenta.';

COMMENT ON COLUMN public.pagos.movimiento_pago_id IS
  'Movimiento PAGO en cuenta corriente generado por este cobro.';

CREATE INDEX idx_pagos_socio
  ON public.pagos (socio_id);

CREATE INDEX idx_pagos_cobrador
  ON public.pagos (cobrador_id);

CREATE INDEX idx_pagos_rendicion
  ON public.pagos (rendicion_id)
  WHERE rendicion_id IS NOT NULL;

CREATE INDEX idx_pagos_fecha
  ON public.pagos (fecha_hora_pago DESC);

CREATE INDEX idx_pagos_cuota
  ON public.pagos (cuota_id);

-- =============================================================================
-- 6. Triggers: updated_at
-- =============================================================================

CREATE TRIGGER trg_cobradores_updated_at
  BEFORE UPDATE ON public.cobradores
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_rendiciones_updated_at
  BEFORE UPDATE ON public.rendiciones
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 7. Inmutabilidad de pagos + sync automático estado_cuota
-- (también disponible en 20250607100000_cobranza_guards_and_sync.sql si ya aplicó hasta §6)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pagos_reversiones (
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

CREATE INDEX IF NOT EXISTS idx_pagos_reversiones_pago
  ON public.pagos_reversiones (pago_id);

CREATE OR REPLACE FUNCTION public.prevent_pagos_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'Los registros de pagos son inmutables. Para corregir un error, registre una reversión en pagos_reversiones.';
END;
$$;

DROP TRIGGER IF EXISTS trg_pagos_no_update ON public.pagos;
CREATE TRIGGER trg_pagos_no_update
  BEFORE UPDATE ON public.pagos
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_pagos_mutation();

DROP TRIGGER IF EXISTS trg_pagos_no_delete ON public.pagos;
CREATE TRIGGER trg_pagos_no_delete
  BEFORE DELETE ON public.pagos
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_pagos_mutation();

CREATE OR REPLACE FUNCTION public.calcular_total_vigente_cuota(p_cuota_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(p.importe), 0)
  FROM public.pagos p
  WHERE p.cuota_id = p_cuota_id
    AND NOT EXISTS (
      SELECT 1 FROM public.pagos_reversiones r WHERE r.pago_id = p.id
    );
$$;

CREATE OR REPLACE FUNCTION public.sync_estado_cuota(p_cuota_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_monto_cuota numeric;
  v_total_pagado  numeric;
  v_nuevo_estado  public.estado_cuota;
BEGIN
  SELECT m.monto INTO v_monto_cuota
  FROM public.movimientos_cuenta m
  WHERE m.id = p_cuota_id AND m.tipo = 'CARGO';

  IF NOT FOUND THEN RETURN; END IF;

  v_total_pagado := public.calcular_total_vigente_cuota(p_cuota_id);

  IF v_monto_cuota = 0 OR v_total_pagado >= v_monto_cuota THEN
    v_nuevo_estado := 'PAGADA';
  ELSE
    v_nuevo_estado := 'PENDIENTE';
  END IF;

  UPDATE public.movimientos_cuenta
  SET estado_cuota = v_nuevo_estado
  WHERE id = p_cuota_id AND tipo = 'CARGO';
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_pagos_sync_estado_cuota()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.sync_estado_cuota(NEW.cuota_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pagos_after_insert_sync_cuota ON public.pagos;
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
  SELECT cuota_id INTO v_cuota_id FROM public.pagos WHERE id = NEW.pago_id;
  IF v_cuota_id IS NOT NULL THEN
    PERFORM public.sync_estado_cuota(v_cuota_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pagos_reversion_after_insert_sync_cuota ON public.pagos_reversiones;
CREATE TRIGGER trg_pagos_reversion_after_insert_sync_cuota
  AFTER INSERT ON public.pagos_reversiones
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reversion_sync_estado_cuota();

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.movimientos_cuenta WHERE tipo = 'CARGO'
  LOOP
    PERFORM public.sync_estado_cuota(r.id);
  END LOOP;
END;
$$;

-- =============================================================================
-- Verificación
-- =============================================================================
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('cobradores', 'pagos', 'rendiciones', 'pagos_reversiones');
