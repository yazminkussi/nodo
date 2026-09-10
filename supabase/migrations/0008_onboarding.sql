-- ============================================================
-- NODO · Migración 0008 — Alta de institución (onboarding)
-- Una persona registrada crea su club y queda como superadmin.
-- ============================================================

-- `comunidades` no tiene política de INSERT a propósito: la creación pasa
-- sólo por esta función, que además arma la membresía de superadmin en la
-- misma transacción.
create or replace function public.crear_comunidad(
  p_nombre text,
  p_tipo   text default null,
  p_ciudad text default null,
  p_barrio text default null,
  p_plan   text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_base text;
  v_slug text;
  v_n    integer := 0;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;
  if coalesce(trim(p_nombre), '') = '' then
    raise exception 'Falta el nombre del club';
  end if;

  -- Una persona no puede tener más de un club propio (evita spam de altas).
  if exists (
    select 1 from public.membresias
    where perfil_id = v_uid and rol = 'superadmin' and estado = 'activa'
  ) then
    raise exception 'Ya sos administrador de una institución';
  end if;

  -- slug: minúsculas, sin acentos, separado por guiones
  v_base := lower(trim(p_nombre));
  v_base := translate(
    v_base,
    'áàäâãéèëêíìïîóòöôõúùüûñç',
    'aaaaaeeeeiiiiooooouuuunc'
  );
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := trim(both '-' from v_base);
  if v_base = '' then
    v_base := 'club';
  end if;
  v_base := left(v_base, 40);

  v_slug := v_base;
  while exists (select 1 from public.comunidades where id = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  insert into public.comunidades (id, nombre, tipo, ciudad, barrio, plan)
  values (
    v_slug,
    trim(p_nombre),
    nullif(trim(coalesce(p_tipo, '')), ''),
    nullif(trim(coalesce(p_ciudad, '')), ''),
    nullif(trim(coalesce(p_barrio, '')), ''),
    coalesce(nullif(trim(coalesce(p_plan, '')), ''), 'Plan 100 Socios')
  );

  insert into public.membresias (perfil_id, comunidad_id, rol, estado)
  values (v_uid, v_slug, 'superadmin', 'activa');

  return v_slug;
end;
$$;

grant execute on function public.crear_comunidad(text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
