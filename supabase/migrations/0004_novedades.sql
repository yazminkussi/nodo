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
