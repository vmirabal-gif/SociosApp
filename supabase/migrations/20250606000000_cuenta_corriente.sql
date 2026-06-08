-- =============================================================================
-- Club 9 de Julio Olímpico de Freyre — Módulo Cuenta Corriente
-- Ejecutar en Supabase SQL Editor DESPUÉS de 20250605000000_socios_module.sql
--
-- Modelo:
--   • Sin tabla cuentas_corrientes
--   • movimientos_cuenta → socio_id XOR grupo_familiar_id
--   • Saldo = SUM(CARGO) - SUM(PAGO)  (calculado en aplicación, no persistido)
--   • Una cuota por período y sujeto de cobro (índices únicos parciales)
--   • INACTIVO manual (estado_manual) no genera cuotas
--   • Alta en mes M → primera cuota en M (lógica en aplicación)
--   • Grupo familiar: un CARGO por grupo_familiar_id; referencia fecha_alta titular
-- =============================================================================

-- =============================================================================
-- 1. Enum: tipo_movimiento
-- =============================================================================

CREATE TYPE public.tipo_movimiento AS ENUM (
  'CARGO',
  'PAGO'
);

-- =============================================================================
-- 2. Alteración: socios.estado_manual
-- =============================================================================

ALTER TABLE public.socios
  ADD COLUMN IF NOT EXISTS estado_manual boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.socios.estado_manual IS
  'true = INACTIVO definido manualmente por el club. No genera cuotas ni recálculo automático de estado.';

COMMENT ON COLUMN public.socios.deuda_actual IS
  'DEPRECADO: usar saldo calculado desde movimientos_cuenta. Se dejará de usar en la aplicación.';

-- =============================================================================
-- 3. Tabla: configuracion_cuotas
-- =============================================================================

CREATE TABLE public.configuracion_cuotas (
  id              uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_socio      public.tipo_socio NOT NULL,
  monto           numeric(12, 2)    NOT NULL,
  vigente_desde   date              NOT NULL DEFAULT CURRENT_DATE,
  vigente_hasta   date,
  created_at      timestamptz       NOT NULL DEFAULT now(),
  updated_at      timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT configuracion_cuotas_monto_no_negativo
    CHECK (monto >= 0),

  CONSTRAINT configuracion_cuotas_vigencia_valida
    CHECK (vigente_hasta IS NULL OR vigente_hasta >= vigente_desde)
);

COMMENT ON TABLE public.configuracion_cuotas IS
  'Tarifas mensuales por tipo de socio. Editar = cerrar vigente + insertar nueva fila.';

-- Una sola tarifa vigente por tipo_socio
CREATE UNIQUE INDEX idx_configuracion_cuotas_vigente_unica
  ON public.configuracion_cuotas (tipo_socio)
  WHERE vigente_hasta IS NULL;

CREATE INDEX idx_configuracion_cuotas_tipo_vigencia
  ON public.configuracion_cuotas (tipo_socio, vigente_desde DESC);

-- =============================================================================
-- 4. Tabla: generaciones_cuotas
-- =============================================================================

CREATE TABLE public.generaciones_cuotas (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo           char(7)     NOT NULL,
  ejecutado_en      timestamptz NOT NULL DEFAULT now(),
  cargos_creados    integer     NOT NULL DEFAULT 0,
  cargos_omitidos   integer     NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT generaciones_cuotas_periodo_formato
    CHECK (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),

  CONSTRAINT generaciones_cuotas_contadores_no_negativos
    CHECK (cargos_creados >= 0 AND cargos_omitidos >= 0),

  CONSTRAINT generaciones_cuotas_periodo_unico
    UNIQUE (periodo)
);

COMMENT ON TABLE public.generaciones_cuotas IS
  'Auditoría de generación masiva de cuotas mensuales por período YYYY-MM.';

-- =============================================================================
-- 5. Tabla: movimientos_cuenta
-- =============================================================================

CREATE TABLE public.movimientos_cuenta (
  id                      uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id                uuid                  REFERENCES public.socios (id)
                                                ON DELETE RESTRICT,
  grupo_familiar_id       uuid                  REFERENCES public.grupos_familiares (id)
                                                ON DELETE RESTRICT,
  tipo                    public.tipo_movimiento NOT NULL,
  monto                   numeric(12, 2)        NOT NULL,
  periodo                 char(7),
  fecha                   date                  NOT NULL DEFAULT CURRENT_DATE,
  concepto                text                  NOT NULL DEFAULT '',
  notas                   text,
  configuracion_cuota_id  uuid                  REFERENCES public.configuracion_cuotas (id)
                                                ON DELETE SET NULL,
  generacion_cuota_id     uuid                  REFERENCES public.generaciones_cuotas (id)
                                                ON DELETE SET NULL,
  created_at              timestamptz             NOT NULL DEFAULT now(),

  -- Exactamente un vínculo: socio individual/becado O grupo familiar
  CONSTRAINT movimientos_cuenta_sujeto_xor
    CHECK (
      (socio_id IS NOT NULL AND grupo_familiar_id IS NULL)
      OR
      (socio_id IS NULL AND grupo_familiar_id IS NOT NULL)
    ),

  -- PAGO siempre > 0; CARGO permite 0 (becados)
  CONSTRAINT movimientos_cuenta_monto_valido
    CHECK (
      (tipo = 'PAGO' AND monto > 0)
      OR
      (tipo = 'CARGO' AND monto >= 0)
    ),

  CONSTRAINT movimientos_cuenta_periodo_formato
    CHECK (periodo IS NULL OR periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),

  CONSTRAINT movimientos_cuenta_cargo_requiere_periodo
    CHECK (tipo <> 'CARGO' OR periodo IS NOT NULL),

  CONSTRAINT movimientos_cuenta_concepto_no_vacio
    CHECK (char_length(trim(concepto)) > 0),

  CONSTRAINT movimientos_cuenta_fecha_valida
    CHECK (fecha <= CURRENT_DATE)
);

COMMENT ON TABLE public.movimientos_cuenta IS
  'Libro de cuenta corriente. CARGO=cuota; PAGO=cobro manual. Saldo calculado en app.';

COMMENT ON COLUMN public.movimientos_cuenta.socio_id IS
  'Movimientos de socios INDIVIDUAL o BECADO.';

COMMENT ON COLUMN public.movimientos_cuenta.grupo_familiar_id IS
  'Movimientos del grupo familiar (una cuota por período).';

COMMENT ON COLUMN public.movimientos_cuenta.periodo IS
  'YYYY-MM. Obligatorio en CARGO de cuota mensual.';

-- Evitar dos cuotas del mismo período para el mismo socio
CREATE UNIQUE INDEX idx_movimientos_un_cargo_por_socio_periodo
  ON public.movimientos_cuenta (socio_id, periodo)
  WHERE tipo = 'CARGO' AND socio_id IS NOT NULL;

-- Evitar dos cuotas del mismo período para el mismo grupo familiar
CREATE UNIQUE INDEX idx_movimientos_un_cargo_por_grupo_periodo
  ON public.movimientos_cuenta (grupo_familiar_id, periodo)
  WHERE tipo = 'CARGO' AND grupo_familiar_id IS NOT NULL;

-- Consultas por sujeto de cobro
CREATE INDEX idx_movimientos_socio_fecha
  ON public.movimientos_cuenta (socio_id, fecha DESC)
  WHERE socio_id IS NOT NULL;

CREATE INDEX idx_movimientos_grupo_fecha
  ON public.movimientos_cuenta (grupo_familiar_id, fecha DESC)
  WHERE grupo_familiar_id IS NOT NULL;

CREATE INDEX idx_movimientos_tipo
  ON public.movimientos_cuenta (tipo);

CREATE INDEX idx_movimientos_periodo
  ON public.movimientos_cuenta (periodo)
  WHERE periodo IS NOT NULL;

-- =============================================================================
-- 6. Trigger: updated_at en configuracion_cuotas
-- =============================================================================

CREATE TRIGGER trg_configuracion_cuotas_updated_at
  BEFORE UPDATE ON public.configuracion_cuotas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 7. Datos iniciales: tarifas vigentes
-- =============================================================================

INSERT INTO public.configuracion_cuotas (tipo_socio, monto, vigente_desde)
VALUES
  ('INDIVIDUAL'::public.tipo_socio, 3000.00, CURRENT_DATE),
  ('FAMILIAR'::public.tipo_socio,   6000.00, CURRENT_DATE),
  ('BECADO'::public.tipo_socio,        0.00, CURRENT_DATE);

-- =============================================================================
-- Verificación (ejecutar después de aplicar la migración)
-- =============================================================================
--
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'configuracion_cuotas',
--     'movimientos_cuenta',
--     'generaciones_cuotas'
--   );
--
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'socios'
--   AND column_name = 'estado_manual';
--
-- SELECT tipo_socio, monto, vigente_desde, vigente_hasta
-- FROM public.configuracion_cuotas
-- ORDER BY tipo_socio;
