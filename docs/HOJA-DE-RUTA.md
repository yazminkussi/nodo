# Hoja de ruta de profesionalización — NODO

> De prototipo funcional a producto. Documento de trabajo — v1, 31/08/2026.
> Versión visual: https://claude.ai/code/artifact/98b6880e-91e0-4d6c-af61-d15a7a9c777c

## Diagnóstico

Lo que hay hoy está bien construido, pero es una **demo**: casi todo el estado vive
en el navegador con datos ficticios. Profesionalizarlo es ponerle backend real,
identidad de usuario y prácticas de ingeniería de producto.

| Área             | Estado actual                                                                                   |            |
| ---------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| Frontend         | React 18 + Vite + Tailwind + Zustand + framer-motion. ~7.300 LOC, ~40 componentes. PWA.         | sólido     |
| Datos            | Socios, reservas, cuotas, actividades, multi-tenant: todo en `mockData.ts` + `zustand/persist`. | simulado   |
| Backend          | Supabase parcial: sólo logo/nombre en vivo y registros de acceso. Sin `.env` corre en demo.     | parcial    |
| Autenticación    | No existe. El rol socio/admin es un botón. Sin aislamiento por comunidad.                       | ausente    |
| Roles admin      | SuperAdmin / Deportes / Talleres simulados con un selector.                                     | simulado   |
| Seguridad del QR | Secreto HMAC _hardcodeado_ en el cliente (`qrPayload.js`): se puede falsificar.                 | a corregir |
| Calidad          | ESLint OK. Sin README, tests, CI ni deploy automatizado. Mezcla `.jsx`/`.js`.                   | incompleto |
| Repositorio      | Manual de marca `.ai` (2 MB) sin trackear en la raíz. Sin licencia.                             | a ordenar  |

**Lectura honesta:** el MVP vence el 10/9. La profesionalización completa se
extiende más allá del 19/11. Primero un corte vertical real y demostrable; el
resto por fases.

## Decisiones tomadas

- **MVP 10/9:** mínimo — login + socios reales de punta a punta; el resto en demo.
- **TypeScript:** incremental, empezando por `lib/`, `store/` y utilidades.
- **Deploy:** Vercel, conectado al repo (auto-deploy en cada push).
- **Modo demo:** se mantiene como _fallback_ explícito para presentar sin conexión.

## Fases

### Fase 0 — Fundaciones del repositorio · S (1–2 sesiones)

Que cualquiera pueda clonar, entender y desplegar en minutos.

- [x] `README.md`, `LICENSE` (MIT), `CONTRIBUTING.md`, `CHANGELOG.md`.
- [x] Sacar los `.ai` del repo → `brand/` ignorado.
- [x] CI en GitHub Actions: lint + formato + build.
- [x] Prettier + `.editorconfig`.
- [ ] Verificar deploy en Vercel con URL de producción pública (sin protección de login).

### Fase 1 — Backend real + autenticación · L (6–10 sesiones)

Reemplazar los datos ficticios por una base de datos real con identidad de usuario.

- Esquema Supabase completo: `comunidades, perfiles, membresias, espacios, actividades, inscripciones, reservas, pagos, novedades, publicidades`.
- Supabase Auth: registro/login (email + magic link), recuperación, sesión persistente.
- Row Level Security: cada usuario ve sólo su comunidad; socio vs. admin.
- Capa de datos `src/lib/api/` que sustituye a `mockData`; Zustand pasa a cachear.
- Migraciones versionadas (`supabase/migrations`) + seed con los datos demo.
- Modo demo conservado como fallback explícito.
- Contra la base real: auth, comunidades + membresías, socios, novedades,
  espacios + reservas, actividades + inscripciones. Falta: publicidades, Drive.
- **Entregable:** diagrama entidad-relación + documento de arquitectura (24/9).

### Fase 2 — Roles y permisos real · M (2–3 sesiones)

- Tabla `membresias(usuario, comunidad, rol, categorias)` como fuente del rol.
- Políticas RLS por rol.
- Guardas de UI derivadas del rol real.
- Invitaciones de administradores por comunidad.
- **Entregable:** matriz de roles y permisos.

### Fase 3 — Seguridad del control de acceso · M (2–3 sesiones)

- [x] Firma/verificación del QR en Edge Functions (`carnet-token`,
      `verificar-carnet`); el secreto sólo en el servidor (`CARNET_SECRET`).
- [x] Validación del ingreso server-side (cuota y reserva consultadas al escanear) + registro en `registros_acceso` desde la función.
- [x] TTL corto (15 min). Falta el _nonce_ de un solo uso.
- Rate limiting explícito sobre las funciones.
- **Entregable:** [`docs/SEGURIDAD-QR.md`](SEGURIDAD-QR.md) — nota técnica + modelo de amenaza.

### Fase 4 — Pruebas, tipos y automatización · M–L (4–6 sesiones)

- [x] Vitest + Testing Library: utilidades, servicios y store.
- [x] Playwright: flujos E2E (login, portal socio, panel admin, reserva, talleres).
- TypeScript incremental: capa de datos (`lib/api`), máquina de sesión y hooks
  (`store/`, `hooks/`) ya en `.ts`. Falta migrar los componentes `.jsx → .tsx`.
- Prettier + lint-staged + Husky (pre-commit); CI bloquea merge si fallan tests.
- **Entregable:** suite de tests + pipeline verde.

### Fase 5 — Design system y UX · M–L (4–6 sesiones)

- Tokens de diseño desde el manual de marca → `tailwind.config` + CSS vars.
- Componentes base unificados: `Button, Card, Badge, Modal, Input, EmptyState, Skeleton`.
- Estados de carga, vacío y error en cada vista con datos remotos.
- Accesibilidad AA.
- Onboarding del admin (primer login).
- Auditoría con usuarios reales → informe.
- **Entregable:** informe de usabilidad y ajustes de UX (22/10).

### Fase 6 — PWA sólida y performance · S–M (2–3 sesiones)

- [x] Reemplazar el `sw.js` manual por `vite-plugin-pwa` (Workbox) — ver [`docs/PWA.md`](PWA.md).
- [x] Offline real para el carnet y las novedades (precache + NetworkFirst de datos).
- [x] Code splitting por ruta/sección (`React.lazy` de portal/admin + `manualChunks`).
- Presupuesto Lighthouse medido en CI.
- **Entregable:** reporte Lighthouse antes/después.

### Fase 7 — Observabilidad y despliegue productivo · S–M (2–3 sesiones)

- Entornos `staging` y `producción` con bases Supabase separadas.
- Registro de errores (Sentry) en front y Edge Functions.
- Analítica respetuosa de la privacidad (Plausible/Umami).
- Dominio propio + backups.
- **Entregable:** runbook de operación.

## Encaje con el cronograma

| Fecha | Entrega                                      | Estado objetivo                                                        |
| ----- | -------------------------------------------- | ---------------------------------------------------------------------- |
| 10/9  | 5 · MVP                                      | Fase 0 + corte vertical de Fase 1 (login + socios reales), desplegado. |
| 24/9  | 6 · Investigación de usuarios y arquitectura | Fase 1 al 80–100%. ERD = documento de arquitectura. + entrevistas.     |
| 8/10  | 7 · Estrategia de lanzamiento                | Fases 2 y 3. Plan de onboarding de institución piloto.                 |
| 22/10 | 8 · Pruebas de usabilidad                    | Fase 5. Auditoría A11y + sesiones con usuarios → informe.              |
| 5/11  | 9 · Pre-entrega                              | Fase 4 (CI verde) y Fase 6. Proyecto estable y medido.                 |
| 19/11 | 10 · Presentación                            | Fase 7 según tiempo. Demo en vivo + fallback demo offline.             |
