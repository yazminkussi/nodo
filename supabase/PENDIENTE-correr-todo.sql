-- ============================================================================
-- NODO · Todo lo pendiente, en un solo archivo
-- ----------------------------------------------------------------------------
-- Pegá TODO esto en el SQL Editor de Supabase y ejecutá UNA vez (botón "Run").
--
-- Es seguro aunque algo ya esté aplicado: usa "if not exists",
-- "create or replace", "drop policy if exists" y "on conflict do nothing".
--
-- Da por hecho que YA corriste 0001_base.sql + seed.sql + 0002 (existen los
-- helpers es_miembro / es_admin / set_updated_at y la comunidad "La Unión").
--
-- Contiene, EN ESTE ORDEN:
--   1) schema.sql  · comunidad_config, registros_acceso, bucket de logos
--   2) 0003        · arregla reclamar_socio()
--   3) 0004        · novedades + seed
--   4) 0005        · espacios + reservas + seed
--   5) 0006        · invitaciones de administradores
--   6) 0007        · actividades / talleres + inscripciones + seed
-- ============================================================================



-- ############################################################################
-- 1) schema.sql
-- ############################################################################

-- ============================================================
-- NODO · Esquema de sincronización de marca y control de acceso
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Tabla: comunidad_config
-- Guarda la configuración activa de la comunidad (logo público en
-- Storage + nombre), clave para la sincronización de marca en vivo.
-- ------------------------------------------------------------
create table if not exists public.comunidad_config (
  comunidad_id   text primary key,
  nombre         text,
  logo_url       text,
  logo_etag      text,             -- cambia en cada subida (invalida caché)
  updated_at     timestamptz default now()
);

comment on table public.comunidad_config is
  'Configuración viva de la comunidad (logo en Storage + nombre) para sincronización real-time.';

-- Actualiza updated_at automáticamente en cada cambio
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_comunidad_config_updated on public.comunidad_config;
create trigger trg_comunidad_config_updated
  before update on public.comunidad_config
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) Tabla: registros_acceso
-- Historial de cada escaneo / ingreso (verificado por QR).
-- ------------------------------------------------------------
create table if not exists public.registros_acceso (
  id              bigint generated always as identity primary key,
  usuario_id      bigint,
  numero_socio    text,
  nombre          text,
  comunidad_id    text,
  comunidad_nombre text,
  timestamp       timestamptz default now(),
  estado_al_ingreso text,          -- 'Al día' | 'Adeuda'
  resultado       text,            -- 'permitido' | 'denegado' | 'invalido'
  motivo          text,
  escaneado_por   text,
  metodo          text,            -- 'qr' | 'manual'
  detalle_reserva text,
  override        boolean default false
);

create index if not exists idx_registros_timestamp on public.registros_acceso (timestamp desc);
create index if not exists idx_registros_comunidad on public.registros_acceso (comunidad_id);

-- ------------------------------------------------------------
-- 3) Realtime: activar publicación de tablas para los cambios en vivo
-- ------------------------------------------------------------
do $rt$ begin alter publication supabase_realtime add table public.comunidad_config; exception when duplicate_object then null; end $rt$;
do $rt$ begin alter publication supabase_realtime add table public.registros_acceso; exception when duplicate_object then null; end $rt$;

-- ------------------------------------------------------------
-- 4) Storage: bucket "logos" para las imágenes de los logos
--    (público de lectura para que las PWAs puedan mostrarlo)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Política: cualquiera puede leer los logos (son públicos)
drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read"
  on storage.objects for select
  using (bucket_id = 'logos');

-- Política: sólo el Admin autenticado sube/actualiza/borra logos
drop policy if exists "logos_auth_write" on storage.objects;
create policy "logos_auth_write"
  on storage.objects for insert
  with check (bucket_id = 'logos' and auth.role() = 'authenticated');

drop policy if exists "logos_auth_update" on storage.objects;
create policy "logos_auth_update"
  on storage.objects for update
  using (bucket_id = 'logos' and auth.role() = 'authenticated');

drop policy if exists "logos_auth_delete" on storage.objects;
create policy "logos_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'logos' and auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- 5) RLS en comunidad_config
--    Lectura pública (las PWAs de los socios deben ver el logo),
--    escritura sólo para usuarios autenticados (Admin).
-- ------------------------------------------------------------
alter table public.comunidad_config enable row level security;

drop policy if exists "comunidad_config_public_read" on public.comunidad_config;
create policy "comunidad_config_public_read"
  on public.comunidad_config for select
  using (true);

drop policy if exists "comunidad_config_auth_write" on public.comunidad_config;
create policy "comunidad_config_auth_write"
  on public.comunidad_config for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- RLS en registros_acceso: lectura/inserción para autenticados (realtime).
alter table public.registros_acceso enable row level security;

drop policy if exists "registros_auth_read" on public.registros_acceso;
create policy "registros_auth_read"
  on public.registros_acceso for select
  using (auth.role() = 'authenticated');

drop policy if exists "registros_auth_insert" on public.registros_acceso;
create policy "registros_auth_insert"
  on public.registros_acceso for insert
  with check (auth.role() = 'authenticated');


-- ############################################################################
-- 0003_fix_reclamar_socio.sql
-- ############################################################################

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


-- ############################################################################
-- 0004_novedades.sql
-- ############################################################################

-- ============================================================
-- NODO · Migración 0004 — Novedades / comunicados de la comunidad
-- ============================================================

create table if not exists public.novedades (
  id           uuid primary key default gen_random_uuid(),
  comunidad_id text not null references public.comunidades (id) on delete cascade,
  titulo       text not null,
  contenido    text not null default '',
  categoria    text not null default 'Comunicado',  -- Institucional | Evento | Comunicado | Comunidad
  emoji        text default '📣',
  destacada    boolean not null default false,
  fecha        date not null default current_date,
  autor_id     uuid references public.perfiles (id) on delete set null,
  creada_en    timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_novedades_comunidad on public.novedades (comunidad_id, fecha desc);

drop trigger if exists trg_novedades_updated on public.novedades;
create trigger trg_novedades_updated
  before update on public.novedades
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RLS: los miembros leen; cualquier admin de la comunidad gestiona
-- ------------------------------------------------------------
alter table public.novedades enable row level security;

drop policy if exists "novedades_miembros_select" on public.novedades;
create policy "novedades_miembros_select" on public.novedades
  for select using (public.es_miembro(comunidad_id));

drop policy if exists "novedades_admin_all" on public.novedades;
create policy "novedades_admin_all" on public.novedades
  for all using (public.es_admin(comunidad_id))
  with check (public.es_admin(comunidad_id));

-- ------------------------------------------------------------
-- Seed de demostración (sólo si la comunidad todavía no tiene novedades)
-- ------------------------------------------------------------
insert into public.novedades (comunidad_id, titulo, contenido, categoria, emoji, destacada, fecha)
select v.comunidad_id, v.titulo, v.contenido, v.categoria, v.emoji, v.destacada, current_date
from (
  values
    ('la-union', 'Asamblea General Ordinaria 2026',
     'Invitamos a todas las socias y socios a la Asamblea General Ordinaria el próximo sábado en el SUM. Se tratarán la memoria y balance del ejercicio y la renovación parcial de la comisión directiva.',
     'Institucional', '🏛️', true),
    ('la-union', 'Copa NODO de Fútbol 5',
     'Arranca el torneo interno más esperado del año. 16 equipos, modalidad liguilla y final en nuestra cancha. Inscripciones abiertas en recepción hasta el viernes.',
     'Evento', '⚽', true),
    ('la-union', 'Nuevas vacantes en Taller de Cerámica',
     'Abrimos 8 nuevos cupos para el taller cultural de cerámica. Cursada semanal los martes y jueves. Reservá tu lugar desde la app y aboná tu cuota social al día.',
     'Comunicado', '🏺', false),
    ('la-union', 'Reajuste de cuota social 2026',
     'Desde agosto la cuota activa pasa a $ 18.000 y la juvenil a $ 12.000. El beneficio de pago anticipado bimestral mantiene un 10% de descuento.',
     'Comunicado', '📋', false),
    ('la-union', 'Feria de Comercios Vecinales',
     'Este sábado el club abre sus puertas a la Feria de Comercios del barrio. 20 locales con descuentos exclusivos para socios. Entrada libre con carnet digital.',
     'Comunidad', '🛍️', false)
) as v(comunidad_id, titulo, contenido, categoria, emoji, destacada)
where not exists (select 1 from public.novedades where comunidad_id = 'la-union');

notify pgrst, 'reload schema';


-- ############################################################################
-- 0005_espacios_reservas.sql
-- ############################################################################

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


-- ############################################################################
-- 0006_invitaciones.sql
-- ############################################################################

-- ============================================================
-- NODO · Migración 0006 — Invitación de administradores
-- Un superadmin invita a alguien por email con un rol. Cuando esa
-- persona inicia sesión, la invitación se convierte en membresía.
-- ============================================================

create table if not exists public.invitaciones (
  id           uuid primary key default gen_random_uuid(),
  comunidad_id text not null references public.comunidades (id) on delete cascade,
  email        text not null,
  rol          public.rol_membresia not null default 'deportes',
  categorias   text[] not null default '{}',
  estado       text not null default 'pendiente',  -- pendiente | aceptada | revocada
  invitada_por uuid references public.perfiles (id) on delete set null,
  creada_en    timestamptz not null default now(),
  aceptada_en  timestamptz
);

create unique index if not exists uq_invitacion_pendiente
  on public.invitaciones (comunidad_id, lower(email))
  where estado = 'pendiente';

alter table public.invitaciones enable row level security;

-- El superadmin de la comunidad gestiona sus invitaciones.
drop policy if exists "invitaciones_superadmin_all" on public.invitaciones;
create policy "invitaciones_superadmin_all" on public.invitaciones
  for all using (public.es_superadmin(comunidad_id))
  with check (public.es_superadmin(comunidad_id));

-- La persona invitada puede ver las suyas (por email).
drop policy if exists "invitaciones_propias_select" on public.invitaciones;
create policy "invitaciones_propias_select" on public.invitaciones
  for select using (
    lower(email) = lower((select u.email from auth.users u where u.id = auth.uid()))
  );

-- ------------------------------------------------------------
-- Al iniciar sesión: convierte las invitaciones pendientes del
-- email en membresías.
-- ------------------------------------------------------------
create or replace function public.aceptar_invitaciones()
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

  insert into public.membresias (perfil_id, comunidad_id, rol, categorias)
  select v_uid, i.comunidad_id, i.rol, i.categorias
  from public.invitaciones i
  where i.estado = 'pendiente'
    and lower(i.email) = lower(v_email)
  on conflict (perfil_id, comunidad_id)
    do update set rol = excluded.rol, categorias = excluded.categorias, estado = 'activa';

  update public.invitaciones
    set estado = 'aceptada', aceptada_en = now()
  where estado = 'pendiente'
    and lower(email) = lower(v_email);
end $$;

grant execute on function public.aceptar_invitaciones() to authenticated;

-- ------------------------------------------------------------
-- Administradores actuales de una comunidad (nombre + email).
-- SECURITY DEFINER porque `perfiles` sólo deja ver la fila propia;
-- primero verifica que quien llama es admin de esa comunidad.
-- ------------------------------------------------------------
create or replace function public.equipo_de(cid text)
returns table (
  membresia_id uuid,
  perfil_id    uuid,
  rol          public.rol_membresia,
  categorias   text[],
  nombre       text,
  apellido     text,
  email        text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin(cid) then
    return;
  end if;
  return query
    select m.id, p.id, m.rol, m.categorias, p.nombre, p.apellido, p.email
    from public.membresias m
    join public.perfiles p on p.id = m.perfil_id
    where m.comunidad_id = cid
      and m.estado = 'activa'
      and m.rol in ('superadmin', 'deportes', 'talleres')
    order by m.rol, p.apellido;
end $$;

grant execute on function public.equipo_de(text) to authenticated;

notify pgrst, 'reload schema';


-- ############################################################################
-- 0007_actividades_inscripciones.sql
-- ############################################################################

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


-- ############################################################################
-- Chequeo final: filas por tabla nueva
-- ############################################################################
select 'comunidad_config' as tabla, count(*) from public.comunidad_config
union all select 'novedades',     count(*) from public.novedades
union all select 'espacios',      count(*) from public.espacios
union all select 'reservas',      count(*) from public.reservas
union all select 'invitaciones',  count(*) from public.invitaciones
union all select 'actividades',   count(*) from public.actividades
union all select 'inscripciones', count(*) from public.inscripciones;
