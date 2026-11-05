-- ============================================================
-- NODO · Migración 0017 — Registro de recordatorios por WhatsApp (Kapso)
--
-- La Edge Function `enviar-recordatorio` anota acá cada envío. Sirve para:
--   · no mandarle al mismo socio más de un recordatorio cada 24 hs,
--   · tener historial de quién mandó qué y si Kapso lo aceptó.
-- Sólo la función (service role) inserta; los admins del club lo pueden leer.
-- ============================================================

create table if not exists public.recordatorios_whatsapp (
  id               uuid primary key default gen_random_uuid(),
  comunidad_id     text not null references public.comunidades (id) on delete cascade,
  socio_id         uuid not null references public.socios (id) on delete cascade,
  enviado_por      uuid references public.perfiles (id) on delete set null,
  estado           text not null check (estado in ('enviado', 'error')),
  kapso_message_id text,
  detalle          text,
  creado_en        timestamptz not null default now()
);

create index if not exists idx_recordatorios_socio
  on public.recordatorios_whatsapp (socio_id, creado_en desc);
create index if not exists idx_recordatorios_comunidad
  on public.recordatorios_whatsapp (comunidad_id, creado_en desc);

alter table public.recordatorios_whatsapp enable row level security;

drop policy if exists "recordatorios_admin_select" on public.recordatorios_whatsapp;
create policy "recordatorios_admin_select" on public.recordatorios_whatsapp
  for select using (public.es_admin(comunidad_id));

notify pgrst, 'reload schema';
