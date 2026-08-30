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
alter publication supabase_realtime add table public.comunidad_config;
alter publication supabase_realtime add table public.registros_acceso;

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
