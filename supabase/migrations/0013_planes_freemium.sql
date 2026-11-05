-- ============================================================
-- NODO · Migración 0013 — Modelo freemium (planes por cantidad de socios)
--
--   Gratis       hasta  60 socios
--   Plan 100     hasta 100 socios
--   Plan 250     hasta 250 socios
--   Plan 400+    sin tope
--
-- El límite se aplica en la base (trigger sobre `socios`), no sólo en la
-- interfaz: ni el alta manual, ni el import de CSV, ni una llamada directa a
-- la API pueden pasarse del tope del plan.
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- planes  (catálogo; lectura pública para usuarios logueados)
-- ------------------------------------------------------------
create table if not exists public.planes (
  id             text primary key,
  nombre         text not null,
  limite_socios  integer,                       -- null = sin tope
  precio_mensual integer not null default 0,    -- ARS
  orden          integer not null default 0
);

insert into public.planes (id, nombre, limite_socios, precio_mensual, orden) values
  ('gratis',   'Plan Gratis',      60,     0, 0),
  ('plan-100', 'Plan 100 Socios', 100,  89000, 1),
  ('plan-250', 'Plan 250 Socios', 250, 149000, 2),
  ('plan-400', 'Plan 400+ Socios', null, 219000, 3)
on conflict (id) do update
  set nombre = excluded.nombre,
      limite_socios = excluded.limite_socios,
      precio_mensual = excluded.precio_mensual,
      orden = excluded.orden;

alter table public.planes enable row level security;

drop policy if exists "planes_lectura" on public.planes;
create policy "planes_lectura" on public.planes
  for select to authenticated using (true);

-- ------------------------------------------------------------
-- comunidades.plan_id  (el texto `plan` queda como nombre para mostrar)
-- ------------------------------------------------------------
alter table public.comunidades
  add column if not exists plan_id text references public.planes (id);

-- Clubes existentes: se les respeta el plan que ya tenían.
update public.comunidades c
   set plan_id = p.id
  from public.planes p
 where c.plan_id is null
   and lower(trim(c.plan)) = lower(p.nombre);

-- Lo que no se pueda mapear arranca en Gratis.
update public.comunidades set plan_id = 'gratis' where plan_id is null;

alter table public.comunidades alter column plan_id set default 'gratis';
alter table public.comunidades alter column plan_id set not null;

-- `plan` (texto) siempre refleja el nombre del plan_id.
create or replace function public.sincronizar_nombre_plan()
returns trigger
language plpgsql
as $$
begin
  select nombre into new.plan from public.planes where id = new.plan_id;
  return new;
end $$;

drop trigger if exists trg_comunidades_nombre_plan on public.comunidades;
create trigger trg_comunidades_nombre_plan
  before insert or update on public.comunidades
  for each row execute function public.sincronizar_nombre_plan();

update public.comunidades set plan_id = plan_id;  -- dispara el trigger y alinea el texto

-- El superadmin del club NO puede cambiarse de plan solo (eso se hace con el
-- equipo de NODO, después de contratar): se bloquea el cambio de `plan_id`
-- desde la API; las funciones SECURITY DEFINER y el SQL Editor siguen pudiendo.
create or replace function public.proteger_plan_id()
returns trigger
language plpgsql
as $$
begin
  if new.plan_id is distinct from old.plan_id
     and current_user in ('authenticated', 'anon') then
    raise exception 'El plan sólo puede cambiarlo el equipo de NODO.'
      using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists trg_comunidades_proteger_plan on public.comunidades;
create trigger trg_comunidades_proteger_plan
  before update of plan_id on public.comunidades
  for each row execute function public.proteger_plan_id();

-- ------------------------------------------------------------
-- Límite de socios por plan
-- ------------------------------------------------------------
create or replace function public.limitar_socios_por_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limite integer;
  v_nombre text;
  v_usados integer;
begin
  -- Bloquea la fila del club: altas simultáneas no pueden colarse juntas.
  select p.limite_socios, p.nombre
    into v_limite, v_nombre
    from public.comunidades c
    join public.planes p on p.id = c.plan_id
   where c.id = new.comunidad_id
     for update of c;

  if v_limite is null then
    return new;   -- sin tope (o club inexistente: lo resuelve la FK)
  end if;

  select count(*) into v_usados from public.socios where comunidad_id = new.comunidad_id;

  if v_usados >= v_limite then
    raise exception 'Alcanzaste el límite de % socios del %. Mejorá el plan para sumar más.',
      v_limite, v_nombre
      using errcode = 'P0001', detail = 'limite_plan', hint = v_limite::text;
  end if;

  return new;
end $$;

drop trigger if exists trg_socios_limite_plan on public.socios;
create trigger trg_socios_limite_plan
  before insert on public.socios
  for each row execute function public.limitar_socios_por_plan();

-- ------------------------------------------------------------
-- uso_plan(cid): plan, tope y cantidad de socios usados (sólo admins del club)
-- ------------------------------------------------------------
create or replace function public.uso_plan(cid text)
returns table (plan_id text, plan_nombre text, limite_socios integer, socios_usados integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin(cid) then
    raise exception 'Sin permiso';
  end if;

  return query
    select p.id,
           p.nombre,
           p.limite_socios,
           (select count(*)::integer from public.socios s where s.comunidad_id = cid)
      from public.comunidades c
      join public.planes p on p.id = c.plan_id
     where c.id = cid;
end $$;

grant execute on function public.uso_plan(text) to authenticated;

-- ------------------------------------------------------------
-- crear_comunidad: todo club nuevo arranca en Gratis
-- (el parámetro p_plan se conserva por compatibilidad y se ignora)
-- ------------------------------------------------------------
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

  if exists (
    select 1 from public.membresias
    where perfil_id = v_uid and rol = 'superadmin' and estado = 'activa'
  ) then
    raise exception 'Ya sos administrador de una institución';
  end if;

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

  insert into public.comunidades (id, nombre, tipo, ciudad, barrio, plan_id)
  values (
    v_slug,
    trim(p_nombre),
    nullif(trim(coalesce(p_tipo, '')), ''),
    nullif(trim(coalesce(p_ciudad, '')), ''),
    nullif(trim(coalesce(p_barrio, '')), ''),
    'gratis'
  );

  insert into public.membresias (perfil_id, comunidad_id, rol, estado)
  values (v_uid, v_slug, 'superadmin', 'activa');

  return v_slug;
end;
$$;

grant execute on function public.crear_comunidad(text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
