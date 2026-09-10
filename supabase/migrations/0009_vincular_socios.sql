-- ============================================================
-- NODO · Migración 0009 — Vinculación de fichas de socio a cuentas
-- Dos caminos además del match por email (reclamar_socio):
--   1) el socio se vincula solo con su N° de socio + DNI
--   2) el admin vincula una ficha a una cuenta registrada por email
-- ============================================================

-- ------------------------------------------------------------
-- 1) Auto-vinculación por N° de socio + DNI
--    Busca en TODAS las comunidades una ficha sin dueño que coincida.
-- ------------------------------------------------------------
create or replace function public.vincular_socio_por_datos(
  p_numero text,
  p_dni    text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_dni       text := regexp_replace(coalesce(p_dni, ''), '\D', '', 'g');
  v_numero    text := regexp_replace(coalesce(p_numero, ''), '\D', '', 'g');
  v_socio_id  uuid;
  v_comunidad text;
  v_cant      integer;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;
  if v_dni = '' or v_numero = '' then
    raise exception 'Completá tu número de socio y tu DNI';
  end if;

  select count(*) into v_cant
  from public.socios
  where perfil_id is null
    and regexp_replace(coalesce(dni, ''), '\D', '', 'g') = v_dni
    and regexp_replace(numero, '\D', '', 'g') = v_numero;

  if v_cant = 0 then
    raise exception 'No encontramos una ficha con ese número y DNI. Verificá los datos o pedile a tu club que cargue tu ficha.';
  end if;
  if v_cant > 1 then
    raise exception 'Hay más de una ficha con esos datos. Contactá a la administración de tu club.';
  end if;

  select id, comunidad_id into v_socio_id, v_comunidad
  from public.socios
  where perfil_id is null
    and regexp_replace(coalesce(dni, ''), '\D', '', 'g') = v_dni
    and regexp_replace(numero, '\D', '', 'g') = v_numero
  limit 1;

  update public.socios set perfil_id = v_uid where id = v_socio_id;

  insert into public.membresias (perfil_id, comunidad_id, rol, estado)
  values (v_uid, v_comunidad, 'socio', 'activa')
  on conflict (perfil_id, comunidad_id) do nothing;

  return v_comunidad;
end;
$$;

grant execute on function public.vincular_socio_por_datos(text, text) to authenticated;

-- ------------------------------------------------------------
-- 2) El admin vincula una ficha a una cuenta registrada (por email)
-- ------------------------------------------------------------
create or replace function public.vincular_socio_a_cuenta(
  p_socio_id uuid,
  p_email    text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comunidad text;
  v_dueño     uuid;
  v_perfil    uuid;
begin
  select comunidad_id, perfil_id into v_comunidad, v_dueño
  from public.socios where id = p_socio_id;

  if v_comunidad is null then
    raise exception 'La ficha no existe';
  end if;
  if not public.es_superadmin(v_comunidad) then
    raise exception 'No autorizado';
  end if;
  if v_dueño is not null then
    raise exception 'Esa ficha ya está vinculada a una cuenta';
  end if;

  select id into v_perfil from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_perfil is null then
    raise exception 'No hay ninguna cuenta registrada con ese email';
  end if;

  update public.socios set perfil_id = v_perfil where id = p_socio_id;

  insert into public.membresias (perfil_id, comunidad_id, rol, estado)
  values (v_perfil, v_comunidad, 'socio', 'activa')
  on conflict (perfil_id, comunidad_id) do nothing;
end;
$$;

grant execute on function public.vincular_socio_a_cuenta(uuid, text) to authenticated;

notify pgrst, 'reload schema';
