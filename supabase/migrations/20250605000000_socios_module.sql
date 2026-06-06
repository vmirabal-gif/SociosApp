-- =============================================================================
-- Club 9 de Julio Olímpico de Freyre — Módulo Socios
-- Script limpio: elimina estructura previa y crea el modelo definitivo.
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================

-- =============================================================================
-- 1. Eliminar estructura previa
-- =============================================================================

DROP TRIGGER IF EXISTS trg_socios_generar_numero ON public.socios;
DROP TRIGGER IF EXISTS trg_socios_updated_at ON public.socios;
DROP TRIGGER IF EXISTS trg_grupos_familiares_updated_at ON public.grupos_familiares;

DROP TABLE IF EXISTS public.socios CASCADE;
DROP TABLE IF EXISTS public.socios_legacy CASCADE;
DROP TABLE IF EXISTS public.grupos_familiares CASCADE;

DROP SEQUENCE IF EXISTS public.socios_numero_seq;

DROP FUNCTION IF EXISTS public.generar_numero_socio();
DROP FUNCTION IF EXISTS public.sincronizar_secuencia_socios();
DROP FUNCTION IF EXISTS public.set_updated_at();

DROP TYPE IF EXISTS public.parentesco_tipo CASCADE;
DROP TYPE IF EXISTS public.estado_socio CASCADE;
DROP TYPE IF EXISTS public.tipo_socio CASCADE;

-- =============================================================================
-- 2. Enums
-- =============================================================================

CREATE TYPE public.tipo_socio AS ENUM (
  'INDIVIDUAL',
  'FAMILIAR',
  'BECADO'
);

CREATE TYPE public.estado_socio AS ENUM (
  'ACTIVO',
  'MOROSO',
  'INACTIVO'
);

CREATE TYPE public.parentesco_tipo AS ENUM (
  'spouse',
  'child',
  'parent',
  'sibling',
  'other'
);

-- =============================================================================
-- 3. Secuencia para numero_socio (M-001, M-002, …)
-- =============================================================================

CREATE SEQUENCE public.socios_numero_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- =============================================================================
-- 4. Tabla: grupos_familiares
-- =============================================================================

CREATE TABLE public.grupos_familiares (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text        NOT NULL,
  notas       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT grupos_familiares_nombre_no_vacio
    CHECK (char_length(trim(nombre)) > 0),

  CONSTRAINT grupos_familiares_nombre_unico
    UNIQUE (nombre)
);

-- =============================================================================
-- 5. Tabla: socios
-- =============================================================================

CREATE TABLE public.socios (
  id                  uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_socio        text                NOT NULL DEFAULT '',
  nombre              text                NOT NULL,
  apellido            text                NOT NULL,
  dni                 text                NOT NULL,
  tipo_socio          public.tipo_socio   NOT NULL DEFAULT 'INDIVIDUAL',
  estado              public.estado_socio NOT NULL DEFAULT 'ACTIVO',
  deuda_actual        numeric(12, 2)      NOT NULL DEFAULT 0,
  fecha_alta          date                NOT NULL DEFAULT CURRENT_DATE,
  fecha_nacimiento    date                NOT NULL,
  telefono            text,
  email               text,
  direccion           text,
  notas               text,
  grupo_familiar_id   uuid                REFERENCES public.grupos_familiares (id)
                                          ON DELETE SET NULL,
  es_titular          boolean             NOT NULL DEFAULT false,
  parentesco          public.parentesco_tipo,
  created_at          timestamptz         NOT NULL DEFAULT now(),
  updated_at          timestamptz         NOT NULL DEFAULT now(),

  CONSTRAINT socios_numero_socio_unico
    UNIQUE (numero_socio),

  CONSTRAINT socios_dni_unico
    UNIQUE (dni),

  CONSTRAINT socios_nombre_no_vacio
    CHECK (char_length(trim(nombre)) > 0),

  CONSTRAINT socios_apellido_no_vacio
    CHECK (char_length(trim(apellido)) > 0),

  CONSTRAINT socios_dni_no_vacio
    CHECK (char_length(trim(dni)) > 0),

  CONSTRAINT socios_deuda_no_negativa
    CHECK (deuda_actual >= 0),

  CONSTRAINT socios_fecha_alta_valida
    CHECK (fecha_alta <= CURRENT_DATE),

  CONSTRAINT socios_fecha_nacimiento_valida
    CHECK (
      fecha_nacimiento <= CURRENT_DATE
      AND fecha_nacimiento >= CURRENT_DATE - INTERVAL '120 years'
    ),

  CONSTRAINT socios_email_formato
    CHECK (
      email IS NULL
      OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    ),

  CONSTRAINT socios_titular_sin_parentesco
    CHECK (NOT es_titular OR parentesco IS NULL),

  CONSTRAINT socios_integrante_requiere_parentesco
    CHECK (
      es_titular
      OR grupo_familiar_id IS NULL
      OR parentesco IS NOT NULL
    ),

  CONSTRAINT socios_titular_requiere_grupo
    CHECK (NOT es_titular OR grupo_familiar_id IS NOT NULL),

  CONSTRAINT socios_sin_grupo_no_titular
    CHECK (grupo_familiar_id IS NOT NULL OR NOT es_titular)
);

-- =============================================================================
-- 6. Índices
-- =============================================================================

CREATE UNIQUE INDEX idx_socios_un_titular_por_grupo
  ON public.socios (grupo_familiar_id)
  WHERE es_titular = true AND grupo_familiar_id IS NOT NULL;

CREATE INDEX idx_socios_nombre_apellido
  ON public.socios (nombre, apellido);

CREATE INDEX idx_socios_dni
  ON public.socios (dni);

CREATE INDEX idx_socios_numero_socio
  ON public.socios (numero_socio);

CREATE INDEX idx_socios_estado
  ON public.socios (estado);

CREATE INDEX idx_socios_tipo_socio
  ON public.socios (tipo_socio);

CREATE INDEX idx_socios_grupo_familiar_id
  ON public.socios (grupo_familiar_id);

CREATE INDEX idx_socios_fecha_alta
  ON public.socios (fecha_alta DESC);

CREATE INDEX idx_grupos_familiares_nombre
  ON public.grupos_familiares (nombre);

-- =============================================================================
-- 7. Funciones
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generar_numero_socio()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numero_socio IS NULL OR trim(NEW.numero_socio) = '' THEN
    NEW.numero_socio := 'M-' || lpad(nextval('public.socios_numero_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 8. Triggers
-- =============================================================================

CREATE TRIGGER trg_grupos_familiares_updated_at
  BEFORE UPDATE ON public.grupos_familiares
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_socios_updated_at
  BEFORE UPDATE ON public.socios
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_socios_generar_numero
  BEFORE INSERT ON public.socios
  FOR EACH ROW
  EXECUTE FUNCTION public.generar_numero_socio();
