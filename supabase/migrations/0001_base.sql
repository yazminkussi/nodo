-- ============================================================
-- NODO · Migración 0001 — Esquema base (Fase 1)
-- Comunidades, perfiles, membresías (rol) y socios, con RLS.
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- comunidades  (multi-tenant · una fila por institución)
-- ------------------------------------------------------------
create table if not exists public.comunidades (
  id           text primary key,               -- slug legible: 'la-union'
  nombre       text not null,
  institucion  text,
  tipo         text,
  direccion    text,
  ciudad       text,
  barrio       text,
  cuit         text,
  telefono     text,
  email        text,
  plan         text default 'Plan 100 Socios',
  logo_url     text,
  creada_en    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- perfiles  (1:1 con auth.users · datos de la persona logueada)
-- ------------------------------------------------------------
create table if not exists public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text,
  apellido   text,
  email      text,
  telefono   text,
  avatar_url text,
  creado_en  timestamptz not null default now()
);

-- Al registrarse un usuario, se crea su perfil automáticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, email, nombre, apellido)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellido', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- membresías  (qué rol tiene un perfil en una comunidad)
-- ------------------------------------------------------------
do $$ begin
  create type public.rol_membresia as enum ('socio', 'superadmin', 'deportes', 'talleres');
exception when duplicate_object then null;
end $$;

create table if not exists public.membresias (
  id           uuid primary key default gen_random_uuid(),
  perfil_id    uuid not null references public.perfiles (id) on delete cascade,
  comunidad_id text not null references public.comunidades (id) on delete cascade,
  rol          public.rol_membresia not null default 'socio',
  categorias   text[] not null default '{}',      -- para roles de área (Deportivo/Cultural)
  estado       text not null default 'activa',    -- activa | suspendida
  creada_en    timestamptz not null default now(),
  unique (perfil_id, comunidad_id)
);

create index if not exists idx_membresias_perfil on public.membresias (perfil_id);
create index if not exists idx_membresias_comunidad on public.membresias (comunidad_id);

-- ------------------------------------------------------------
-- socios  (ficha de socio dentro de una comunidad)
-- El perfil es opcional: un socio existe aunque todavía no tenga login.
-- ------------------------------------------------------------
create table if not exists public.socios (
  id           uuid primary key default gen_random_uuid(),
  comunidad_id text not null references public.comunidades (id) on delete cascade,
  perfil_id    uuid references public.perfiles (id) on delete set null,
  numero       text not null,
  nombre       text not null,
  apellido     text not null,
  dni          text,
  email        text,
  celular      text,
  categoria    text not null default 'Activo',   -- Activo | Adherente | Juvenil | Honorario
  cuota_al_dia boolean not null default true,
  ultima_cuota date,
  cuota_monto  integer not null default 0,
  localidad    text,
  color        text default '#0D9488',
  creado_en    timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (comunidad_id, numero)
);

create index if not exists idx_socios_comunidad on public.socios (comunidad_id);
create index if not exists idx_socios_perfil on public.socios (perfil_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_socios_updated on public.socios;
create trigger trg_socios_updated
  before update on public.socios
  for each row execute function public.set_updated_at();

-- ============================================================
-- Funciones de ayuda para las políticas (SECURITY DEFINER para
-- no entrar en recursión al consultar `membresias` desde RLS).
-- ============================================================
create or replace function public.es_miembro(cid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membresias
    where perfil_id = auth.uid() and comunidad_id = cid and estado = 'activa'
  );
$$;

create or replace function public.es_admin(cid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membresias
    where perfil_id = auth.uid() and comunidad_id = cid and estado = 'activa'
      and rol in ('superadmin', 'deportes', 'talleres')
  );
$$;

create or replace function public.es_superadmin(cid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membresias
    where perfil_id = auth.uid() and comunidad_id = cid and estado = 'activa'
      and rol = 'superadmin'
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.comunidades enable row level security;
alter table public.perfiles    enable row level security;
alter table public.membresias  enable row level security;
alter table public.socios      enable row level security;

-- perfiles: cada quien ve y edita su propia fila
drop policy if exists "perfil_propio_select" on public.perfiles;
create policy "perfil_propio_select" on public.perfiles
  for select using (id = auth.uid());

drop policy if exists "perfil_propio_update" on public.perfiles;
create policy "perfil_propio_update" on public.perfiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- comunidades: los miembros ven su comunidad; el superadmin la edita
drop policy if exists "comunidad_miembros_select" on public.comunidades;
create policy "comunidad_miembros_select" on public.comunidades
  for select using (public.es_miembro(id));

drop policy if exists "comunidad_superadmin_update" on public.comunidades;
create policy "comunidad_superadmin_update" on public.comunidades
  for update using (public.es_superadmin(id)) with check (public.es_superadmin(id));

-- membresías: cada quien ve las propias; los admins ven las de su comunidad;
-- el superadmin las gestiona
drop policy if exists "membresia_propia_select" on public.membresias;
create policy "membresia_propia_select" on public.membresias
  for select using (perfil_id = auth.uid());

drop policy if exists "membresia_admin_select" on public.membresias;
create policy "membresia_admin_select" on public.membresias
  for select using (public.es_admin(comunidad_id));

drop policy if exists "membresia_superadmin_all" on public.membresias;
create policy "membresia_superadmin_all" on public.membresias
  for all using (public.es_superadmin(comunidad_id))
  with check (public.es_superadmin(comunidad_id));

-- socios: los admins leen todas las fichas de su comunidad; cada socio ve la suya;
-- el superadmin da de alta / edita / baja
drop policy if exists "socios_admin_select" on public.socios;
create policy "socios_admin_select" on public.socios
  for select using (public.es_admin(comunidad_id));

drop policy if exists "socios_ficha_propia_select" on public.socios;
create policy "socios_ficha_propia_select" on public.socios
  for select using (perfil_id = auth.uid());

drop policy if exists "socios_superadmin_all" on public.socios;
create policy "socios_superadmin_all" on public.socios
  for all using (public.es_superadmin(comunidad_id))
  with check (public.es_superadmin(comunidad_id));
