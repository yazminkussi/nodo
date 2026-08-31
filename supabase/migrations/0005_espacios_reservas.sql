-- ============================================================
-- NODO · Migración 0005 — Espacios y reservas
-- ============================================================

-- ------------------------------------------------------------
-- espacios
-- ------------------------------------------------------------
create table if not exists public.espacios (
  id             uuid primary key default gen_random_uuid(),
  comunidad_id   text not null references public.comunidades (id) on delete cascade,
  nombre         text not null,
  descripcion    text default '',
  capacidad      integer not null default 10,
  precio_hora    integer not null default 0,
  icono          text default 'sum',
  color          text default '#5E52C4',
  categoria      text not null default 'Deportivo',  -- Deportivo | Cultural | Recreativo
  disponible     boolean not null default true,
  horario        jsonb not null default
    '{"apertura":"09:00","cierre":"22:00","duracionTurno":1,"dias":[1,2,3,4,5,6]}'::jsonb,
  creado_en      timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_espacios_comunidad on public.espacios (comunidad_id);

drop trigger if exists trg_espacios_updated on public.espacios;
create trigger trg_espacios_updated
  before update on public.espacios
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- reservas
-- ------------------------------------------------------------
create table if not exists public.reservas (
  id             uuid primary key default gen_random_uuid(),
  comunidad_id   text not null references public.comunidades (id) on delete cascade,
  espacio_id     uuid not null references public.espacios (id) on delete cascade,
  socio_id       uuid references public.socios (id) on delete set null,
  perfil_id      uuid references public.perfiles (id) on delete set null,
  socio_nombre   text,
  fecha          date not null,
  inicio         text not null,          -- 'HH:MM'
  fin            text not null,          -- 'HH:MM'
  estado         text not null default 'confirmada',  -- confirmada | pendiente | cancelada
  concepto       text,
  creada_en      timestamptz not null default now()
);

create index if not exists idx_reservas_comunidad on public.reservas (comunidad_id, fecha);
create index if not exists idx_reservas_espacio on public.reservas (espacio_id, fecha);

-- Evita reservar exactamente el mismo turno dos veces.
create unique index if not exists uq_reserva_slot
  on public.reservas (espacio_id, fecha, inicio)
  where estado <> 'cancelada';

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.espacios enable row level security;
alter table public.reservas enable row level security;

-- espacios: los miembros ven; los admins gestionan
drop policy if exists "espacios_miembros_select" on public.espacios;
create policy "espacios_miembros_select" on public.espacios
  for select using (public.es_miembro(comunidad_id));

drop policy if exists "espacios_admin_all" on public.espacios;
create policy "espacios_admin_all" on public.espacios
  for all using (public.es_admin(comunidad_id))
  with check (public.es_admin(comunidad_id));

-- reservas: los miembros ven las de su comunidad (para ver disponibilidad);
-- un socio crea/cancela las propias; los admins gestionan todas
drop policy if exists "reservas_miembros_select" on public.reservas;
create policy "reservas_miembros_select" on public.reservas
  for select using (public.es_miembro(comunidad_id));

drop policy if exists "reservas_socio_insert" on public.reservas;
create policy "reservas_socio_insert" on public.reservas
  for insert with check (public.es_miembro(comunidad_id) and perfil_id = auth.uid());

drop policy if exists "reservas_socio_update_propia" on public.reservas;
create policy "reservas_socio_update_propia" on public.reservas
  for update using (perfil_id = auth.uid());

drop policy if exists "reservas_admin_all" on public.reservas;
create policy "reservas_admin_all" on public.reservas
  for all using (public.es_admin(comunidad_id))
  with check (public.es_admin(comunidad_id));

-- ------------------------------------------------------------
-- Seed de espacios (sólo si la comunidad no tiene ninguno)
-- ------------------------------------------------------------
insert into public.espacios
  (comunidad_id, nombre, descripcion, capacidad, precio_hora, icono, color, categoria, horario)
select 'la-union', v.nombre, v.descripcion, v.capacidad, v.precio_hora, v.icono, v.color, v.categoria, v.horario::jsonb
from (
  values
    ('Cancha de Fútbol 5', 'Césped sintético y luces LED para partidos nocturnos.', 22, 18000, 'futbol', '#2E8B5E', 'Deportivo', '{"apertura":"09:00","cierre":"22:00","duracionTurno":1,"dias":[1,2,3,4,5,6]}'),
    ('Taller de Cerámica', 'Sala equipada con tornos, horno y mesas de trabajo.', 16, 6500, 'ceramica', '#5E52C4', 'Cultural', '{"apertura":"10:00","cierre":"21:00","duracionTurno":1,"dias":[1,2,3,4,5]}'),
    ('Gimnasio', 'Musculación, funcional y clases de cross training.', 40, 8000, 'gimnasio', '#4B8FB0', 'Deportivo', '{"apertura":"09:00","cierre":"22:00","duracionTurno":1,"dias":[1,2,3,4,5,6]}'),
    ('SUM · Salón de Usos Múltiples', 'Eventos, asambleas y celebraciones. Hasta 120 personas.', 120, 25000, 'sum', '#32328E', 'Recreativo', '{"apertura":"09:00","cierre":"22:00","duracionTurno":3,"dias":[1,2,3,4,5,6,0]}'),
    ('Sala de Ensayo', 'Aislada y amplificada. Ideal para bandas y proyectos musicales.', 8, 5000, 'ensayo', '#7C74D6', 'Cultural', '{"apertura":"09:00","cierre":"23:00","duracionTurno":1,"dias":[1,2,3,4,5,0]}'),
    ('Cancha de Pádel', 'Canchas cubiertas con vidrio templado y alquiler de paletas.', 8, 12000, 'padel', '#4B8FB0', 'Deportivo', '{"apertura":"09:00","cierre":"23:00","duracionTurno":1,"dias":[1,2,3,4,5,6]}'),
    ('Pileta climatizada', 'Pileta techada de 25 m. Natación libre y escuelita.', 30, 9000, 'pileta', '#4B8FB0', 'Deportivo', '{"apertura":"07:00","cierre":"21:00","duracionTurno":1,"dias":[1,2,3,4,5,6]}'),
    ('Parrilla y Quincho', 'Quincho techado con parrilla, mesadas y heladera.', 25, 10000, 'parrilla', '#C56A46', 'Recreativo', '{"apertura":"09:00","cierre":"22:00","duracionTurno":3,"dias":[5,6,0]}'),
    ('Aula de Talleres', 'Aula equipada con tablero, proyector y bancos.', 20, 7000, 'aula', '#5E52C4', 'Cultural', '{"apertura":"09:00","cierre":"22:00","duracionTurno":1,"dias":[1,2,3,4,5,6]}')
) as v(nombre, descripcion, capacidad, precio_hora, icono, color, categoria, horario)
where not exists (select 1 from public.espacios where comunidad_id = 'la-union');

notify pgrst, 'reload schema';
