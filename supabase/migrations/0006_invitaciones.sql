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
