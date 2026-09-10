-- ============================================================
-- NODO · Migración 0012 — Nonce de un solo uso para el carnet QR
-- Cada QR generado trae un token aleatorio; al escanearlo, la Edge
-- Function `verificar-carnet` lo registra acá. Un segundo escaneo del
-- mismo QR (dentro de los 15 min de validez) choca con la PK y se
-- rechaza como reutilización.
-- ============================================================

create table if not exists public.qr_usados (
  qr_token     text primary key,
  comunidad_id text,
  socio_id     uuid,
  usado_en     timestamptz not null default now()
);

create index if not exists idx_qr_usados_usado_en on public.qr_usados (usado_en);

-- Sólo el servicio (Edge Function con service role) escribe acá.
alter table public.qr_usados enable row level security;
-- Sin políticas: nadie con JWT normal puede leer ni escribir. La función
-- usa la service role, que salta RLS.

-- Limpieza: al insertar, borra los tokens de hace más de 1 hora
-- (el TTL del QR es 15 min, así que nada más viejo importa).
create or replace function public.limpiar_qr_usados()
returns trigger
language plpgsql
as $$
begin
  delete from public.qr_usados where usado_en < now() - interval '1 hour';
  return new;
end;
$$;

drop trigger if exists trg_limpiar_qr_usados on public.qr_usados;
create trigger trg_limpiar_qr_usados
  after insert on public.qr_usados
  for each statement execute function public.limpiar_qr_usados();

notify pgrst, 'reload schema';
