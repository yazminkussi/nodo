<div align="center">
  <img src="public/imagenes/nodo_logo.png" alt="NODO" width="120" />
  <h1>NODO · Experiencia Digital para Comunidades</h1>
  <p><strong>Una plataforma que une la gestión administrativa interna de un club o centro cultural con la experiencia comunitaria de sus socios.</strong></p>
</div>

---

NODO es una Web App / PWA responsive pensada para clubes deportivos, centros culturales y movimientos juveniles. Reemplaza el ecosistema informal de _WhatsApp + Excel + carpetas_ por una sola herramienta: carnet digital con QR, reservas de espacios, control de cuotas, inscripción a talleres, control de acceso y comunicación con la comunidad.

Proyecto **Trabajo Anual — UMAI**. Autora: **Yazmín Laila Kussi**.

## App en vivo

- **Producción:** https://nodo-yazminkussi-8286s-projects.vercel.app
- Cada `push` a `main` despliega automáticamente en Vercel. Cada rama genera un _preview_ propio.

## Estado del proyecto

|                         |                                                                            |
| ----------------------- | -------------------------------------------------------------------------- |
| **Fase actual**         | Fase 0 — Fundaciones del repositorio                                       |
| **Modo de datos**       | Demo (estado local en el navegador) + sincronización opcional con Supabase |
| **Backend real + Auth** | En hoja de ruta (Fase 1)                                                   |

La hoja de ruta completa de profesionalización está en [`docs/HOJA-DE-RUTA.md`](docs/HOJA-DE-RUTA.md).

## Funcionalidades

**Para el socio**

- Carnet digital con QR dinámico y firmado (vigencia corta anti-replay).
- Estado de cuota al día / en deuda.
- Reserva de espacios (canchas, SUM, salas) con horarios dinámicos.
- Inscripción a talleres y actividades culturales.
- Novedades y beneficios de comercios del barrio.

**Para la administración**

- Panel con métricas de morosidad y ocupación.
- Gestión de socios, cuotas y pagos.
- CRUD de espacios y actividades con horarios configurables.
- Control de acceso por escaneo de QR (con override manual y registro).
- Roles de administración (SuperAdmin / Deportes / Talleres).
- Multi-tenant: varias comunidades sobre la misma instancia.
- Personalización de marca (logo + nombre) sincronizada en vivo entre dispositivos.
- NODO Drive: documentos, planillas y plantillas internas.

## Stack

| Capa             | Tecnología                                       |
| ---------------- | ------------------------------------------------ |
| UI               | React 18, Vite 5                                 |
| Estilos          | Tailwind CSS 3                                   |
| Estado           | Zustand (con `persist`)                          |
| Animación        | Framer Motion                                    |
| Iconos           | lucide-react                                     |
| QR               | `qrcode` (generación) + `html5-qrcode` (escaneo) |
| Backend opcional | Supabase (Postgres, Realtime, Storage)           |
| PWA              | Manifest + Service Worker                        |
| Deploy           | Vercel                                           |

## Cómo correr en local

Requisitos: **Node.js ≥ 20** y npm.

```bash
git clone https://github.com/yazminkussi/nodo.git
cd nodo
npm install
npm run dev
```

Abre http://localhost:5173. Sin configuración de Supabase, la app funciona en **modo demo** con datos de ejemplo.

### Scripts

| Script                 | Descripción                                             |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo (Vite).                          |
| `npm run build`        | Build de producción en `dist/`.                         |
| `npm run preview`      | Sirve el build de producción localmente.                |
| `npm run lint`         | ESLint sobre `src/`.                                    |
| `npm run format`       | Formatea el código con Prettier.                        |
| `npm run format:check` | Verifica el formato sin modificar (lo que corre en CI). |

## Configuración de Supabase (opcional)

Sin estas variables NODO corre en modo demo. Para activar la sincronización de marca en vivo y el registro en la nube de los accesos:

1. Copiá `.env.example` a `.env.local` y completá:

   ```bash
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon/public key>
   ```

   Ambos valores están en Supabase → _Project Settings → API_. La `anon key` es pública por diseño (viaja en el cliente).

2. Ejecutá [`supabase/schema.sql`](supabase/schema.sql) en el _SQL Editor_ de tu proyecto. Crea las tablas `comunidad_config` y `registros_acceso`, el bucket `logos` y las políticas de Realtime / RLS.

> **Nunca** pongas en el repo ni en `.env.local` el `service_role key` ni la contraseña de la base de datos.

## Estructura

```
src/
├── components/        Componentes de UI (panel admin, portal socio, QR, Drive…)
├── hooks/             Hooks (Realtime de Supabase, PWA update, escáner QR)
├── lib/               Servicios: cliente Supabase, marca, registros de acceso
├── store/             Estado global (Zustand)
├── data/              Datos de demostración y utilidades de dominio
├── utils/             Helpers (payload del QR, imágenes, feedback)
└── styles/            Estilos globales
public/                Assets estáticos, manifest, service worker, iconos
supabase/              Esquema SQL
docs/                  Hoja de ruta y documentación del proyecto
brand/                 Fuentes de diseño (.ai) — no versionadas
```

## Contribuir

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md). El historial de cambios está en [`CHANGELOG.md`](CHANGELOG.md).

## Licencia

[MIT](LICENSE) © 2026 Yazmín Laila Kussi
