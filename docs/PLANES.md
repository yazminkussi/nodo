# Planes y modelo freemium

Quien paga es **el club**; los socios usan su carnet gratis, siempre.

|                                | Gratis | Plan 100 | Plan 250 | Plan 400+ |
| ------------------------------ | ------ | -------- | -------- | --------- |
| Precio / mes (ARS)             | 0      | 89.000   | 149.000  | 219.000   |
| Socios                         | 60     | 100      | 250      | sin tope  |
| Espacios reservables           | 3      | 6        | sin tope | sin tope  |
| Publicidades de comercios      | 0      | 1        | 3        | sin tope  |
| Métricas de recaudación/ocup.  | —      | —        | sí       | sí        |
| Recordatorios por WhatsApp     | —      | —        | sí       | sí        |
| Panel completo (Equipo, Drive) | —      | —        | sí       | sí        |

El Plan 400+ también lista multisede, integración con facturación y módulo de
eventos y torneos como **"Próximamente"** (todavía no existen en la app).

## Dónde vive cada cosa

- **Base (fuente de verdad):** tabla `planes` + `comunidades.plan_id`
  (migraciones `0013_planes_freemium.sql` y `0014_capacidades_plan.sql`). El
  texto `comunidades.plan` es sólo el nombre para mostrar y se sincroniza solo.
- **Topes (socios, espacios, publicidades):** triggers `before insert` que
  bloquean la fila del club para que dos altas simultáneas no se cuelen juntas.
  Si se pasan devuelven `P0001` con `detail = 'limite_plan'`.
- **Import de CSV:** `useSocios.importar` consulta `uso_plan` antes y es "todo o
  nada".
- **Funciones por plan (métricas, WhatsApp, panel completo):** las lee la
  interfaz con `usePlan()` (`src/hooks/usePlan.ts`) y muestra el candado /
  `PlanBloqueado`. Son bloqueos de interfaz, no de la base.
- **Interfaz:** `planesB2B` en `src/data/mockData.ts` es una copia para mostrar y
  **debe coincidir con la tabla `planes`** (hay un test que cuida la coherencia
  de la matriz).

## Cambiar de plan (versión de entrega: sin cobro)

En "Planes NODO" el superadmin toca **Mejorar / Cambiar a este plan** y se aplica
al instante (RPC `cambiar_plan`, migración 0015). No cobra nada. Se puede subir y
bajar libremente: si el club tiene más socios, espacios o publicidades de los que
entran en el plan nuevo, **conserva lo que ya tiene** y sólo se bloquean las altas
nuevas por encima del tope.

> Cuando exista el cobro online, `cambiar_plan` pasa a ser interna (la llamará el
> webhook de pago) y se le quita el permiso a `authenticated`.

El trigger `proteger_plan_id` impide cambiar `plan_id` con un `update` directo
desde la API. Desde el SQL Editor de Supabase sí se puede:

```sql
update public.comunidades set plan_id = 'plan-250' where id = 'slug-del-club';
```

## Pendiente

- Cobro online (Mercado Pago / Stripe) y cambio de plan automático.
- Bloqueo en la base de las funciones por plan (hoy es sólo de interfaz).
- Multisede, integración con facturación y eventos y torneos (Plan 400+).
