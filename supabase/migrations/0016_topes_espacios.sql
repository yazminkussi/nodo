-- ============================================================
-- NODO · Migración 0016 — Topes de espacios más generosos
--   Gratis: 1 -> 3 espacios · Plan 100: 3 -> 6 espacios
-- ============================================================

update public.planes set limite_espacios = 3 where id = 'gratis';
update public.planes set limite_espacios = 6 where id = 'plan-100';

notify pgrst, 'reload schema';
