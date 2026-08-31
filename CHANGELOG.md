# Changelog

Todos los cambios notables del proyecto se documentan acá.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Agregado
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
