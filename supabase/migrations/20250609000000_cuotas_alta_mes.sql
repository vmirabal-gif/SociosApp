-- =============================================================================
-- Club 9 de Julio Olimpico de Freyre - Cuotas desde mes de alta
-- Ejecutar DESPUES de 20250607000000_cobranza_module.sql
--
-- Regla de negocio:
--   * Alta en mes M genera cuota del periodo M.
--   * La generacion masiva solo completa periodos faltantes.
--   * Nunca debe existir mas de un CARGO por sujeto y periodo.
-- =============================================================================

-- Socios INDIVIDUAL / BECADO: una cuota por socio y periodo.
CREATE UNIQUE INDEX IF NOT EXISTS idx_movimientos_un_cargo_por_socio_periodo
  ON public.movimientos_cuenta (socio_id, periodo)
  WHERE tipo = 'CARGO' AND socio_id IS NOT NULL;

-- Grupos familiares: una cuota por grupo y periodo.
CREATE UNIQUE INDEX IF NOT EXISTS idx_movimientos_un_cargo_por_grupo_periodo
  ON public.movimientos_cuenta (grupo_familiar_id, periodo)
  WHERE tipo = 'CARGO' AND grupo_familiar_id IS NOT NULL;

COMMENT ON INDEX public.idx_movimientos_un_cargo_por_socio_periodo IS
  'Evita duplicar cuotas CARGO por socio y periodo.';

COMMENT ON INDEX public.idx_movimientos_un_cargo_por_grupo_periodo IS
  'Evita duplicar cuotas CARGO por grupo familiar y periodo.';
