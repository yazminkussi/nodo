-- ============================================================
-- NODO · Migración 0007 — Actividades / talleres e inscripciones
-- Los socios se inscriben desde la app; los admins gestionan el
-- catálogo y los cupos. Cupo controlado en la base con un trigger.
-- ============================================================

-- ------------------------------------------------------------
-- actividades
-- ------------------------------------------------------------
create table if not exists public.actividades (
  id             uuid primary key default gen_random_uuid(),
  comunidad_id   text not null references public.comunidades (id) on delete cascade,
  nombre         text not null,
  descripcion    text default '',
  categoria      text not null default 'Cultural',   -- Deportivo | Cultural | Recreativo
  instructor     text not null default '',
  cupo_maximo    integer not null default 15,
  dias           jsonb not null default '[2,4]'::jsonb,  -- number[] (0=domingo)
  inicio         text not null default '18:00',          -- 'HH:MM'
  duracion       numeric not null default 1.5,           -- horas
  costo_mensual  integer not null default 0,
  color          text default '#5E52C4',
  icono          text default 'yoga',
  espacio_id     uuid references public.espacios (id) on delete set null,
  activa         boolean not null default true,
  creado_en      timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_actividades_comunidad on public.actividades (comunidad_id);

drop trigger if exists trg_actividades_updated on public.actividades;
create trigger trg_actividades_updated
  before update on public.actividades
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- inscripciones
-- ------------------------------------------------------------
create table if not exists public.inscripciones (
  id             uuid primary key default gen_random_uuid(),
  comunidad_id   text not null references public.comunidades (id) on delete cascade,
  actividad_id   uuid not null references public.actividades (id) on delete cascade,
  socio_id       uuid references public.socios (id) on delete set null,
  perfil_id      uuid references public.perfiles (id) on delete set null,
  socio_nombre   text,
  fecha          date not null default current_date,
  estado         text not null default 'activa',   -- activa | cancelada
  creada_en      timestamptz not null default now()
);

create index if not exists idx_inscripciones_actividad on public.inscripciones (actividad_id);
create index if not exists idx_inscripciones_comunidad on public.inscripciones (comunidad_id);

-- Un mismo socio no puede inscribirse dos veces a la misma actividad.
create unique index if not exists uq_inscripcion_activa
  on public.inscripciones (actividad_id, perfil_id)
  where estado = 'activa';

-- ------------------------------------------------------------
-- Control de cupo en la base
-- ------------------------------------------------------------
create or replace function public.chequear_cupo_actividad()
returns trigger
language plpgsql
as $$
declare
  v_cupo    integer;
  v_activas integer;
begin
  if new.estado <> 'activa' then
    return new;
  end if;

  select cupo_maximo into v_cupo
  from public.actividades
  where id = new.actividad_id;

  select count(*) into v_activas
  from public.inscripciones
  where actividad_id = new.actividad_id
    and estado = 'activa'
    and id <> new.id;

  if v_cupo is not null and v_activas >= v_cupo then
    raise exception 'CUPO_COMPLETO' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_inscripcion_cupo on public.inscripciones;
create trigger trg_inscripcion_cupo
  before insert or update on public.inscripciones
  for each row execute function public.chequear_cupo_actividad();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.actividades enable row level security;
alter table public.inscripciones enable row level security;

-- actividades: los miembros ven; los admins gestionan
drop policy if exists "actividades_miembros_select" on public.actividades;
create policy "actividades_miembros_select" on public.actividades
  for select using (public.es_miembro(comunidad_id));

drop policy if exists "actividades_admin_all" on public.actividades;
create policy "actividades_admin_all" on public.actividades
  for all using (public.es_admin(comunidad_id))
  with check (public.es_admin(comunidad_id));

-- inscripciones: los miembros ven las de su comunidad (para calcular cupos);
-- un socio se inscribe / se da de baja a sí mismo; los admins gestionan todas
drop policy if exists "inscripciones_miembros_select" on public.inscripciones;
create policy "inscripciones_miembros_select" on public.inscripciones
  for select using (public.es_miembro(comunidad_id));

drop policy if exists "inscripciones_socio_insert" on public.inscripciones;
create policy "inscripciones_socio_insert" on public.inscripciones
  for insert with check (public.es_miembro(comunidad_id) and perfil_id = auth.uid());

drop policy if exists "inscripciones_socio_update_propia" on public.inscripciones;
create policy "inscripciones_socio_update_propia" on public.inscripciones
  for update using (perfil_id = auth.uid());

drop policy if exists "inscripciones_admin_all" on public.inscripciones;
create policy "inscripciones_admin_all" on public.inscripciones
  for all using (public.es_admin(comunidad_id))
  with check (public.es_admin(comunidad_id));

-- ------------------------------------------------------------
-- Seed de actividades (sólo si la comunidad no tiene ninguna)
-- ------------------------------------------------------------
insert into public.actividades
  (comunidad_id, nombre, descripcion, categoria, instructor, cupo_maximo, dias, inicio, duracion, costo_mensual, color, icono)
select 'la-union', v.nombre, v.descripcion, v.categoria, v.instructor, v.cupo_maximo,
       v.dias::jsonb, v.inicio, v.duracion, v.costo_mensual, v.color, v.icono
from (
  values
    ('Taekwondo', 'Arte marcial para todas las edades. Dojo acondicionado.', 'Deportivo', 'Sandra Ríos', 20, '[2,4]', '18:00', 1.5, 6000, '#EF4444', 'taekwondo'),
    ('Yoga & Meditación', 'Hatha yoga y meditación guiada en el SUM o al aire libre.', 'Deportivo', 'Carla Ruiz', 12, '[1,3]', '09:00', 1, 5000, '#059669', 'yoga'),
    ('Folclore y Danzas', 'Zambas, chacareras y grupo de proyección folclórica.', 'Cultural', 'Marta Ibáñez', 18, '[5]', '19:00', 2, 4000, '#7C3AED', 'danza'),
    ('Ajedrez', 'Escuela de ajedrez y torneos internos quincenales.', 'Cultural', 'Hugo Pereyra', 16, '[3]', '17:00', 1.5, 3500, '#1E293B', 'ajedrez'),
    ('Teatro comunitario', 'Improvisación, expresión corporal y montaje anual.', 'Cultural', 'Nadia Quiroga', 14, '[4]', '19:30', 2, 4500, '#EC4899', 'teatro'),
    ('Natación infantil', 'Escuelita de natación para menores de 12 años.', 'Deportivo', 'Ramiro Vega', 25, '[2,4,6]', '16:00', 1, 7000, '#06B6D4', 'pileta'),
    ('Pádel recreativo', 'Clínicas mensuales y torneos de parejas mixtas.', 'Deportivo', 'Diego Correa', 16, '[1,5]', '20:00', 1.5, 6500, '#0EA5E9', 'padel')
) as v(nombre, descripcion, categoria, instructor, cupo_maximo, dias, inicio, duracion, costo_mensual, color, icono)
where not exists (select 1 from public.actividades where comunidad_id = 'la-union');

notify pgrst, 'reload schema';
