-- ============================================================
-- NODO · Migración 0014 — Diferenciales reales por plan
--
--                      Gratis  Plan 100  Plan 250  Plan 400+
--   socios                60      100       250      sin tope
--   espacios               1        3     sin tope   sin tope
--   publicidades           0        1        3      sin tope
--   métricas / WhatsApp / panel completo:   —    —     sí       sí
--
-- Los topes de espacios y publicidades se aplican en la base (como el de
-- socios). Las capacidades booleanas las lee la app desde `planes`.
-- Además: `cambiar_plan`, un cambio de plan inmediato y SIN COBRO, pensado
-- para la entrega. Ejecutar después de la 0013.
-- ============================================================

alter table public.planes
  add column if not exists limite_espacios       integer,            -- null = sin tope
  add column if not exists limite_publicidades   integer,            -- null = sin tope
  add column if not exists metricas              boolean not null default false,
  add column if not exists recordatorios         boolean not null default false,
  add column if not exists panel_completo        boolean not null default false;

update public.planes set
  limite_espacios = 1,    limite_publicidades = 0,
  metricas = false, recordatorios = false, panel_completo = false
where id = 'gratis';

update public.planes set
  limite_espacios = 3,    limite_publicidades = 1,
  metricas = false, recordatorios = false, panel_completo = false
where id = 'plan-100';

update public.planes set
  limite_espacios = null, limite_publicidades = 3,
  metricas = true, recordatorios = true, panel_completo = true
where id = 'plan-250';

update public.planes set
  limite_espacios = null, limite_publicidades = null,
  metricas = true, recordatorios = true, panel_completo = true
where id = 'plan-400';

-- ------------------------------------------------------------
-- Tope de espacios
-- ------------------------------------------------------------
create or replace function public.limitar_espacios_por_plan()
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
  select p.limite_espacios, p.nombre
    into v_limite, v_nombre
    from public.comunidades c
    join public.planes p on p.id = c.plan_id
   where c.id = new.comunidad_id
     for update of c;

  if v_limite is null then
    return new;
  end if;

  select count(*) into v_usados from public.espacios where comunidad_id = new.comunidad_id;

  if v_usados >= v_limite then
    raise exception 'Alcanzaste el límite de % % del %. Mejorá el plan para sumar más.',
      v_limite, case when v_limite = 1 then 'espacio' else 'espacios' end, v_nombre
      using errcode = 'P0001', detail = 'limite_plan', hint = v_limite::text;
  end if;

  return new;
end $$;

drop trigger if exists trg_espacios_limite_plan on public.espacios;
create trigger trg_espacios_limite_plan
  before insert on public.espacios
  for each row execute function public.limitar_espacios_por_plan();

-- ------------------------------------------------------------
-- Tope de publicidades
-- ------------------------------------------------------------
create or replace function public.limitar_publicidades_por_plan()
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
  select p.limite_publicidades, p.nombre
    into v_limite, v_nombre
    from public.comunidades c
    join public.planes p on p.id = c.plan_id
   where c.id = new.comunidad_id
     for update of c;

  if v_limite is null then
    return new;
  end if;

  select count(*) into v_usados from public.publicidades where comunidad_id = new.comunidad_id;

  if v_usados >= v_limite then
    raise exception 'El % incluye % %. Mejorá el plan para publicar más.',
      v_nombre, v_limite, case when v_limite = 1 then 'publicidad' else 'publicidades' end
      using errcode = 'P0001', detail = 'limite_plan', hint = v_limite::text;
  end if;

  return new;
end $$;

drop trigger if exists trg_publicidades_limite_plan on public.publicidades;
create trigger trg_publicidades_limite_plan
  before insert on public.publicidades
  for each row execute function public.limitar_publicidades_por_plan();

-- ------------------------------------------------------------
-- cambiar_plan(cid, nuevo): cambio inmediato, SIN COBRO (modo entrega).
-- Sólo el superadmin del club. Si el club tiene más socios, espacios o
-- publicidades de los que entran en el plan nuevo, no deja bajar.
-- Cuando exista el cobro online, esta función pasa a ser interna (la llama
-- el webhook de pago) y se le quita el permiso a `authenticated`.
-- ------------------------------------------------------------
create or replace function public.cambiar_plan(cid text, nuevo text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  p            public.planes%rowtype;
  v_socios     integer;
  v_espacios   integer;
  v_pubs       integer;
begin
  if not public.es_superadmin(cid) then
    raise exception 'Sólo quien administra el club puede cambiar el plan.';
  end if;

  select * into p from public.planes where id = nuevo;
  if not found then
    raise exception 'Plan inexistente';
  end if;

  select count(*) into v_socios   from public.socios       where comunidad_id = cid;
  select count(*) into v_espacios from public.espacios     where comunidad_id = cid;
  select count(*) into v_pubs     from public.publicidades where comunidad_id = cid;

  if p.limite_socios is not null and v_socios > p.limite_socios then
    raise exception 'No podés pasar al %: tu club tiene % socios y el plan permite hasta %.',
      p.nombre, v_socios, p.limite_socios;
  end if;
  if p.limite_espacios is not null and v_espacios > p.limite_espacios then
    raise exception 'No podés pasar al %: tu club tiene % espacios y el plan permite hasta %. Eliminá los que sobren y probá de nuevo.',
      p.nombre, v_espacios, p.limite_espacios;
  end if;
  if p.limite_publicidades is not null and v_pubs > p.limite_publicidades then
    raise exception 'No podés pasar al %: tu club tiene % publicidades y el plan permite hasta %. Eliminá las que sobren y probá de nuevo.',
      p.nombre, v_pubs, p.limite_publicidades;
  end if;

  update public.comunidades set plan_id = nuevo where id = cid;
  return nuevo;
end $$;

grant execute on function public.cambiar_plan(text, text) to authenticated;

notify pgrst, 'reload schema';
