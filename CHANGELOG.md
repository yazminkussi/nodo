# Changelog

Todos los cambios notables del proyecto se documentan acá.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Agregado
- Backend real con Supabase: autenticación (email + magic link), esquema
  multi-tenant con Row Level Security, y capa de datos (`src/lib/api`) con
  fallback a modo demo.
- Entidades contra la base: comunidades, perfiles, membresías, socios,
  novedades, espacios, reservas, actividades / talleres e inscripciones.
- Actividades y talleres reales: catálogo administrable, inscripción de socios
  desde la app y control de cupo en la base (trigger + índice único).
- Tests E2E con Playwright (modo demo): login, portal del socio, panel admin,
  reserva de espacio e inscripción a talleres.
- PWA con Workbox (`vite-plugin-pwa`): precache del app-shell + caché en runtime
  de los datos de Supabase (`NetworkFirst`) y de la marca. Arranca offline.
  Reemplaza el `public/sw.js` escrito a mano. Ver `docs/PWA.md`.
- Code splitting: `SocioPortal` y `AdminDashboard` con `React.lazy`; librerías
  grandes (`react-dom`, `framer-motion`, `supabase`) en chunks propios.
- Migración a TypeScript de la capa de datos (`src/lib/api`), la máquina de
  sesión (`useSesion`), el store demo (`useNodoStore`) y todos los hooks.
  `tsc --noEmit` corre en CI.
- Alta de institución (onboarding): una cuenta registrada crea su club desde
  la app y queda como superadmin (RPC `crear_comunidad`, migración 0008).
  Al entrar sin institución aparece el formulario de alta en vez del portal.
- Import de socios por CSV: subir un archivo o pegar desde Excel, con
  detección de columnas, previsualización, validación y alta en lote
  (detecta faltantes y números repetidos). Plantilla descargable. Botón en
  Gestión de socios.
- Vinculación de fichas de socio a cuentas (migración 0009): el socio se
  vincula solo con su N° de socio + DNI (`vincular_socio_por_datos`), y el
  admin puede vincular una ficha a una cuenta por email
  (`vincular_socio_a_cuenta`). Al entrar sin institución: elegir "soy socio"
  o "administro un club".
- Selector de comunidad en la app real para quien tiene más de una membresía.
- El rol de administración en la UI ahora sale de la membresía real
  (`useAdminRol`); el selector local queda sólo para el modo demo.
- Nonce de un solo uso para el carnet QR (migración 0012): un QR ya escaneado
  no se puede volver a usar dentro de su ventana de validez.
- Cuotas con historial de pagos (migración 0011): tabla `pagos` + RPC
  `registrar_pago_socio` (inserta el pago y deja la cuota al día en una
  transacción). Al registrar un pago se abre un formulario (monto, método,
  período) y se ve el historial del socio. El socio ve sus propios pagos.
- Publicidades de comercios reales (migración 0010): tabla + RLS, alta y baja
  desde el panel, las ve el socio en su portal.
- NODO Drive real (migración 0010): documentos, planillas (NODO Sheet) y textos
  (NODO Doc) en la base; archivos en un bucket privado de Storage con acceso por
  comunidad. Descarga por URL firmada.
- Estados de carga y error en las vistas que leen de Supabase: skeleton
  mientras carga y una tarjeta con "Reintentar" si falla (componente
  `ErrorRemoto`). Antes esas pantallas quedaban en blanco o mostraban ceros.
- Email de invitación de administrador: Edge Function `enviar-invitacion`
  (Resend). Si no hay email configurado, la invitación se crea igual y la app
  lo dice. Botón para reenviar. Guía completa en `docs/EMAIL.md` (incluye el
  SMTP propio para los emails de auth).
- Seguridad del carnet QR: firma y verificación en Edge Functions
  (`carnet-token`, `verificar-carnet`) con el secreto sólo en el servidor. El
  panel de control de acceso valida el ingreso contra la base (cuota + reserva)
  y registra el evento server-side. Ver `docs/SEGURIDAD-QR.md`. El modo demo
  mantiene la firma local.
- Panel de Equipo: el SuperAdmin invita administradores (Deportes / Talleres)
  por email; el rol se activa al iniciar sesión.
- Rediseño visual completo: paleta lavanda de marca + Bricolage Grotesque,
  logo vectorial animado, componentes base en `src/components/ui`.
- Tests unitarios con Vitest (utilidades, payload del QR, mapeos de API, store).
- `docs/ARQUITECTURA.md` — documento de arquitectura.
- `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md` y `LICENSE` (MIT).
- Configuración de Prettier (`.prettierrc.json`, `.prettierignore`) y `.editorconfig`.
- Integración continua en GitHub Actions: lint + formato + build en cada push y PR.
- Hoja de ruta de profesionalización en `docs/HOJA-DE-RUTA.md`.
- Scripts `format` y `format:check` en `package.json`.

### Cambiado
- Las fuentes de diseño (`.ai`) se movieron a `brand/` y se excluyeron del control de versiones.

## [1.0.0] — 2026-08

Primera entrega funcional (prototipo / demo).

### Agregado
- Portal del socio: carnet digital con QR dinámico firmado (HMAC + vigencia anti-replay).
- Panel de administración con métricas de morosidad y ocupación.
- Gestión de socios, cuotas y registro de pagos.
- CRUD de espacios y actividades con horarios dinámicos.
- Reservas de espacios y portal de inscripción a talleres.
- Control de acceso por escaneo de QR, con override manual y registro de ingresos.
- Multi-tenant: soporte de múltiples comunidades.
- Roles de administración: SuperAdmin, Deportes y Talleres.
- Personalización de marca (logo + nombre) con sincronización en vivo vía Supabase Realtime.
- NODO Drive: documentos, planillas y plantillas internas; badge de barrio.
- PWA instalable con auto-actualización de caché.
- Integración opcional con Supabase (config de comunidad + registros de acceso).
