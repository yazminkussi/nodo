# Planes y modelo freemium

Quien paga es **el club**; los socios usan su carnet gratis, siempre.
El plan se corta por **cantidad de socios**.

| Plan            | Tope de socios | Precio / mes (ARS) |
| --------------- | -------------- | ------------------ |
| Plan Gratis     | 60             | 0                  |
| Plan 100 Socios | 100            | 89.000             |
| Plan 250 Socios | 250            | 149.000            |
| Plan 400+       | sin tope       | 219.000            |

## Dónde vive cada cosa

- **Base (fuente de verdad):** tabla `planes` + `comunidades.plan_id`
  (migración `0013_planes_freemium.sql`). El texto `comunidades.plan` es sólo el
  nombre para mostrar y se sincroniza solo.
- **Tope:** trigger `trg_socios_limite_plan` sobre `socios`. Bloquea la fila del
  club para que dos altas simultáneas no se cuelen juntas. Si se pasa, devuelve
  el error `P0001` con `detail = 'limite_plan'`.
- **Import de CSV:** `useSocios.importar` consulta `uso_plan` antes y es "todo o
  nada": si no entran todas las filas no inserta ninguna.
- **Interfaz:** `src/data/mockData.ts` (`planesB2B`, copia para mostrar; debe
  coincidir con la tabla `planes`) y `src/components/B2BOverview.jsx`.

## Cambiar el plan de un club

El club **no** puede cambiarse de plan solo (el trigger `proteger_plan_id` lo
bloquea desde la API). Después de que contrate, desde el SQL Editor de Supabase:

```sql
update public.comunidades set plan_id = 'plan-250' where id = 'slug-del-club';
```

## Pendiente

- Cobro online (Mercado Pago / Stripe) y cambio de plan automático.
- Bloquear funciones por plan (hoy el único límite real es la cantidad de socios).
- Qué pasa si un club baja de plan teniendo más socios que el nuevo tope: hoy
  conserva los existentes y sólo se bloquean las altas nuevas.
