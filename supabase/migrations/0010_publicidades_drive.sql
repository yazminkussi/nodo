-- ============================================================
-- NODO · Migración 0010 — Publicidades de comercios + Drive interno
-- ============================================================

-- ------------------------------------------------------------
-- publicidades  (comercios del barrio con descuento para socios)
-- ------------------------------------------------------------
create table if not exists public.publicidades (
  id           uuid primary key default gen_random_uuid(),
  comunidad_id text not null references public.comunidades (id) on delete cascade,
  negocio      text not null,
  rubro        text not null default 'Comercio local',
  descuento    text not null default '10% OFF',
  descripcion  text not null default '',
  color        text not null default '#059669',
  barrio       text default '',
  destacada    boolean not null default false,
  creada_en    timestamptz not null default now()
);

create index if not exists idx_publicidades_comunidad on public.publicidades (comunidad_id);

alter table public.publicidades enable row level security;

-- Las ven todos los miembros (aparecen en el portal del socio); las gestiona cualquier admin.
drop policy if exists "publicidades_miembros_select" on public.publicidades;
create policy "publicidades_miembros_select" on public.publicidades
  for select using (public.es_miembro(comunidad_id));

drop policy if exists "publicidades_admin_all" on public.publicidades;
create policy "publicidades_admin_all" on public.publicidades
  for all using (public.es_admin(comunidad_id))
  with check (public.es_admin(comunidad_id));

-- ------------------------------------------------------------
-- drive_items  (documentos internos de la comisión)
--   tipo 'archivo' -> archivo en Storage (storage_path)
--   tipo 'sheet'   -> contenido jsonb { columnas, filas }
--   tipo 'doc'     -> contenido jsonb { html }
-- ------------------------------------------------------------
create table if not exists public.drive_items (
  id           uuid primary key default gen_random_uuid(),
  comunidad_id text not null references public.comunidades (id) on delete cascade,
  carpeta_id   text not null,   -- actas | balances | comprobantes | plantillas
  tipo         text not null,   -- archivo | sheet | doc
  nombre       text not null,
  autor        text default '',
  mime         text,
  tamano       integer,
  storage_path text,
  contenido    jsonb,
  creada_en    timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_drive_comunidad on public.drive_items (comunidad_id, carpeta_id);

drop trigger if exists trg_drive_updated on public.drive_items;
create trigger trg_drive_updated
  before update on public.drive_items
  for each row execute function public.set_updated_at();

alter table public.drive_items enable row level security;

-- El Drive es interno: sólo los administradores de la comunidad.
drop policy if exists "drive_admin_all" on public.drive_items;
create policy "drive_admin_all" on public.drive_items
  for all using (public.es_admin(comunidad_id))
  with check (public.es_admin(comunidad_id));

-- ------------------------------------------------------------
-- Storage: bucket privado "drive" para los archivos subidos.
--   Ruta: <comunidad_id>/<uuid>-<nombre>
--   El primer segmento de la ruta identifica la comunidad.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('drive', 'drive', false)
on conflict (id) do nothing;

drop policy if exists "drive_files_admin_select" on storage.objects;
create policy "drive_files_admin_select" on storage.objects
  for select using (
    bucket_id = 'drive' and public.es_admin((storage.foldername(name))[1])
  );

drop policy if exists "drive_files_admin_insert" on storage.objects;
create policy "drive_files_admin_insert" on storage.objects
  for insert with check (
    bucket_id = 'drive' and public.es_admin((storage.foldername(name))[1])
  );

drop policy if exists "drive_files_admin_delete" on storage.objects;
create policy "drive_files_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'drive' and public.es_admin((storage.foldername(name))[1])
  );

-- ------------------------------------------------------------
-- Seed de publicidades (sólo si la comunidad no tiene ninguna)
-- ------------------------------------------------------------
insert into public.publicidades (comunidad_id, negocio, rubro, descuento, descripcion, color, barrio, destacada)
select 'la-union', v.negocio, v.rubro, v.descuento, v.descripcion, v.color, v.barrio, v.destacada
from (
  values
    ('Almacén La Vuelta', 'Alimentos', '15% OFF', 'Descuento para socios presentando el carnet digital en caja.', '#059669', 'Villa Crespo', true),
    ('Verdulería Pura Verdura', 'Alimentos', '10% OFF', '10% en frutas y verduras de estación todos los días.', '#0D9488', 'Caballito', false),
    ('Farmacia San Martín', 'Salud', '20% OFF', 'Descuento en productos de venta libre con el carnet NODO.', '#06B6D4', 'Almagro', true),
    ('Panadería El Trigal', 'Gastronomía', '10% OFF', '10% en panificados artesanales de lunes a viernes.', '#F59E0B', 'Villa Crespo', false),
    ('Barbería Corte Noble', 'Estética', '20% OFF', 'Servicio completo con descuento para socios activos.', '#1E293B', 'Boedo', false)
) as v(negocio, rubro, descuento, descripcion, color, barrio, destacada)
where not exists (select 1 from public.publicidades where comunidad_id = 'la-union');

notify pgrst, 'reload schema';
