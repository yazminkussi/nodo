-- ============================================================
-- NODO · Migración 0015 — Cambiar de plan sin trabas
--
-- Antes `cambiar_plan` no dejaba bajar si el club tenía más socios, espacios
-- o publicidades de los que entran en el plan nuevo. Ahora se puede subir y
-- bajar libremente: el club CONSERVA lo que ya tiene y los topes sólo frenan
-- las altas nuevas (los triggers de la 0013 y la 0014 siguen igual). Las
-- funciones del plan superior vuelven a mostrar el candado en la app.
-- ============================================================

create or replace function public.cambiar_plan(cid text, nuevo text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_superadmin(cid) then
    raise exception 'Sólo quien administra el club puede cambiar el plan.';
  end if;

  if not exists (select 1 from public.planes where id = nuevo) then
    raise exception 'Plan inexistente';
  end if;

  update public.comunidades set plan_id = nuevo where id = cid;
  return nuevo;
end $$;

grant execute on function public.cambiar_plan(text, text) to authenticated;

notify pgrst, 'reload schema';
