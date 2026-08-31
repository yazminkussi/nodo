-- ============================================================
-- NODO · Migración 0003 — Corrige reclamar_socio()
-- La versión anterior devolvía una TABLE con una columna `comunidad_id`
-- que chocaba con la columna de `socios` ("ambiguous"). Se simplifica a
-- `returns void`.
-- ============================================================

drop function if exists public.reclamar_socio();

create or replace function public.reclamar_socio()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    return;
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;
  if v_email is null then
    return;
  end if;

  -- adopta las fichas de socio con ese email que todavía no tienen cuenta
  update public.socios
    set perfil_id = v_uid
  where perfil_id is null
    and lower(email) = lower(v_email);

  -- asegura una membresía 'socio' en cada comunidad donde ahora tiene ficha
  insert into public.membresias (perfil_id, comunidad_id, rol)
  select v_uid, s.comunidad_id, 'socio'
  from public.socios s
  where s.perfil_id = v_uid
  on conflict (perfil_id, comunidad_id) do nothing;
end $$;

grant execute on function public.reclamar_socio() to authenticated;

-- Refresca el caché del API para que el RPC quede disponible al instante.
notify pgrst, 'reload schema';
