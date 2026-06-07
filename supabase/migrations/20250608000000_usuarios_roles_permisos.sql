-- =============================================================================
-- Club 9 de Julio Olimpico de Freyre - Usuarios, roles y permisos
-- Ejecutar DESPUES de 20250607000000_cobranza_module.sql
--
-- Modelo:
--   * auth.users contiene la identidad.
--   * public.usuarios contiene perfil, rol y vinculo opcional a cobrador.
--   * COBRADOR opera siempre con usuarios.cobrador_id.
--   * RLS protege tablas propias del modulo de cobranza.
-- =============================================================================

-- =============================================================================
-- 1. Enum de roles
-- =============================================================================

CREATE TYPE public.rol_usuario AS ENUM (
  'ADMINISTRADOR',
  'CONTADOR',
  'COBRADOR'
);

-- =============================================================================
-- 2. Tabla usuarios
-- =============================================================================

CREATE TABLE public.usuarios (
  id           uuid              PRIMARY KEY REFERENCES auth.users (id)
                                      ON DELETE CASCADE,
  email        text              NOT NULL,
  nombre       text              NOT NULL DEFAULT '',
  apellido     text              NOT NULL DEFAULT '',
  rol          public.rol_usuario NOT NULL,
  cobrador_id  uuid              REFERENCES public.cobradores (id)
                                      ON DELETE SET NULL,
  activo       boolean           NOT NULL DEFAULT true,
  created_at   timestamptz       NOT NULL DEFAULT now(),
  updated_at   timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT usuarios_email_no_vacio
    CHECK (char_length(trim(email)) > 0),

  CONSTRAINT usuarios_cobrador_requiere_vinculo
    CHECK (
      (rol = 'COBRADOR' AND cobrador_id IS NOT NULL)
      OR
      (rol <> 'COBRADOR')
    )
);

COMMENT ON TABLE public.usuarios IS
  'Perfil de aplicacion para auth.users: rol y vinculo a cobrador cuando corresponde.';

CREATE UNIQUE INDEX idx_usuarios_email_unico
  ON public.usuarios (lower(email));

CREATE INDEX idx_usuarios_rol
  ON public.usuarios (rol);

CREATE UNIQUE INDEX idx_usuarios_cobrador_unico
  ON public.usuarios (cobrador_id)
  WHERE cobrador_id IS NOT NULL;

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 3. Helpers de permisos
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.rol_usuario
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.rol
  FROM public.usuarios u
  WHERE u.id = auth.uid()
    AND u.activo = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_cobrador_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.cobrador_id
  FROM public.usuarios u
  WHERE u.id = auth.uid()
    AND u.activo = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'ADMINISTRADOR';
$$;

CREATE OR REPLACE FUNCTION public.is_contador()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'CONTADOR';
$$;

CREATE OR REPLACE FUNCTION public.is_cobrador()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'COBRADOR';
$$;

-- =============================================================================
-- 4. RLS en usuarios
-- =============================================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY usuarios_select_self_or_admin
  ON public.usuarios
  FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY usuarios_insert_admin
  ON public.usuarios
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY usuarios_update_admin
  ON public.usuarios
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- 5. RLS en cobradores
-- =============================================================================

ALTER TABLE public.cobradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY cobradores_select_by_role
  ON public.cobradores
  FOR SELECT
  USING (
    public.is_admin()
    OR public.is_contador()
    OR id = public.current_cobrador_id()
  );

CREATE POLICY cobradores_insert_admin
  ON public.cobradores
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY cobradores_update_admin
  ON public.cobradores
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- 6. RLS en pagos
-- =============================================================================

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY pagos_select_by_role
  ON public.pagos
  FOR SELECT
  USING (
    public.is_admin()
    OR public.is_contador()
    OR cobrador_id = public.current_cobrador_id()
  );

CREATE POLICY pagos_insert_admin_or_own_cobrador
  ON public.pagos
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (
      public.is_cobrador()
      AND cobrador_id = public.current_cobrador_id()
    )
  );

-- UPDATE y DELETE siguen bloqueados por triggers de inmutabilidad.

-- =============================================================================
-- 7. RLS en rendiciones
-- =============================================================================

ALTER TABLE public.rendiciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY rendiciones_select_by_role
  ON public.rendiciones
  FOR SELECT
  USING (
    public.is_admin()
    OR public.is_contador()
    OR cobrador_id = public.current_cobrador_id()
  );

CREATE POLICY rendiciones_insert_admin_or_own_cobrador
  ON public.rendiciones
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (
      public.is_cobrador()
      AND cobrador_id = public.current_cobrador_id()
    )
  );

CREATE POLICY rendiciones_update_admin
  ON public.rendiciones
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- 8. RLS en pagos_reversiones
-- =============================================================================

ALTER TABLE public.pagos_reversiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY pagos_reversiones_select_admin_contador
  ON public.pagos_reversiones
  FOR SELECT
  USING (public.is_admin() OR public.is_contador());

CREATE POLICY pagos_reversiones_insert_admin
  ON public.pagos_reversiones
  FOR INSERT
  WITH CHECK (public.is_admin());

-- =============================================================================
-- Verificacion
-- =============================================================================
--
-- SELECT typname FROM pg_type WHERE typname = 'rol_usuario';
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name = 'usuarios';
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('usuarios', 'cobradores', 'pagos', 'rendiciones');
