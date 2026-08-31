-- ============================================================
-- NODO · Migración 0002 — Vinculación socio ↔ cuenta
-- Cuando una persona se registra, si ya existe una ficha de socio
-- con su mismo email (y sin dueño), se la vincula a su cuenta y se
-- le crea una membresía 'socio' en esa comunidad.
-- ============================================================

create or replace function public.reclamar_socio()
returns table (comunidad_id text, socio_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then
    return;
  end if;

  -- 1) adopta las fichas de socio con ese email que todavía no tienen cuenta
  update public.socios s
    set perfil_id = auth.uid()
  where s.perfil_id is null
    and lower(s.email) = lower(v_email);

  -- 2) asegura una membresía 'socio' en cada comunidad donde ahora tiene ficha
  insert into public.membresias (perfil_id, comunidad_id, rol)
  select auth.uid(), s.comunidad_id, 'socio'
  from public.socios s
  where s.perfil_id = auth.uid()
  on conflict (perfil_id, comunidad_id) do nothing;

  return query
    select s.comunidad_id, s.id
    from public.socios s
    where s.perfil_id = auth.uid();
end $$;

-- Permite a cualquier usuario autenticado reclamar su propia ficha.
grant execute on function public.reclamar_socio() to authenticated;
