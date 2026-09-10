-- ============================================================
-- NODO · Migración 0011 — Historial de pagos de cuota
-- ============================================================

create table if not exists public.pagos (
  id             uuid primary key default gen_random_uuid(),
  comunidad_id   text not null references public.comunidades (id) on delete cascade,
  socio_id       uuid not null references public.socios (id) on delete cascade,
  monto          integer not null,
  fecha          date not null default current_date,
  metodo         text not null default 'efectivo',   -- efectivo | transferencia | tarjeta | mercadopago | otro
  periodo        text,                                -- 'YYYY-MM' que cubre el pago
  concepto       text not null default 'Cuota social',
  registrado_por uuid references public.perfiles (id) on delete set null,
  creado_en      timestamptz not null default now()
);

create index if not exists idx_pagos_socio on public.pagos (comunidad_id, socio_id, fecha desc);

alter table public.pagos enable row level security;

-- Los admins gestionan; el socio ve los pagos de su propia ficha.
drop policy if exists "pagos_admin_all" on public.pagos;
create policy "pagos_admin_all" on public.pagos
  for all using (public.es_admin(comunidad_id))
  with check (public.es_admin(comunidad_id));

drop policy if exists "pagos_socio_select_propios" on public.pagos;
create policy "pagos_socio_select_propios" on public.pagos
  for select using (
    exists (
      select 1 from public.socios s
      where s.id = pagos.socio_id and s.perfil_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- registrar_pago_socio: inserta el pago y pone la cuota al día,
-- en una sola transacción. Sólo un admin de esa comunidad.
-- ------------------------------------------------------------
create or replace function public.registrar_pago_socio(
  p_socio_id uuid,
  p_monto    integer default null,
  p_metodo   text default 'efectivo',
  p_periodo  text default null,
  p_concepto text default 'Cuota social'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comunidad text;
  v_monto     integer;
begin
  select comunidad_id, coalesce(p_monto, cuota_monto)
    into v_comunidad, v_monto
  from public.socios
  where id = p_socio_id;

  if v_comunidad is null then
    raise exception 'La ficha de socio no existe';
  end if;
  if not public.es_admin(v_comunidad) then
    raise exception 'No autorizado';
  end if;

  insert into public.pagos (comunidad_id, socio_id, monto, metodo, periodo, concepto, registrado_por)
  values (
    v_comunidad,
    p_socio_id,
    coalesce(v_monto, 0),
    coalesce(nullif(trim(p_metodo), ''), 'efectivo'),
    nullif(trim(coalesce(p_periodo, '')), ''),
    coalesce(nullif(trim(p_concepto), ''), 'Cuota social'),
    auth.uid()
  );

  update public.socios
    set cuota_al_dia = true,
        ultima_cuota = current_date
  where id = p_socio_id;
end;
$$;

grant execute on function public.registrar_pago_socio(uuid, integer, text, text, text) to authenticated;

notify pgrst, 'reload schema';
