# PWA y offline

NODO es una PWA instalable: se agrega a la pantalla de inicio y arranca sin
conexión. Desde 2026-09 el service worker lo genera **Workbox** vía
`vite-plugin-pwa` (antes era un `sw.js` escrito a mano).

## Cómo funciona

| Recurso                                                              | Estrategia                                    | Caché                             |
| -------------------------------------------------------------------- | --------------------------------------------- | --------------------------------- |
| App-shell (JS, CSS, HTML, íconos, fuentes locales)                   | **Precache** en la instalación                | `workbox-precache`                |
| Navegaciones (abrir la app offline)                                  | `index.html` precacheado (`navigateFallback`) | `workbox-precache`                |
| Datos de Supabase (`/rest/…`: socios, novedades, reservas, talleres) | **NetworkFirst**, timeout 4 s                 | `nodo-datos` (1 día, 80 entradas) |
| Logo / imágenes de marca (`/storage/…`)                              | **StaleWhileRevalidate**                      | `nodo-marca` (30 días)            |
| CSS de Google Fonts                                                  | StaleWhileRevalidate                          | `google-fonts-css`                |
| Tipografías `.woff2` de Google Fonts                                 | **CacheFirst**                                | `google-fonts-woff2` (1 año)      |

- **Offline**: el carnet, las novedades y las últimas reservas/talleres se ven
  con lo último que quedó cacheado. Las escrituras necesitan conexión.
- **Actualizaciones**: `registerType: 'prompt'`. Cuando hay un build nuevo,
  aparece el banner "¡Hay una versión nueva!" ([`PwaUpdateBanner`](../src/components/PwaUpdateBanner.jsx));
  al tocar **Actualizar** se instala el SW nuevo y la app se recarga sola.
- En `npm run dev` el service worker está **desactivado** (`devOptions.enabled: false`)
  para no pelear con el HMR. Se prueba con `npm run build && npm run preview`.

## Config

Todo vive en [`vite.config.js`](../vite.config.js) (bloque `VitePWA`). El manifest
también: ya no hay `public/manifest.json` ni `public/sw.js`. El registro del SW lo
hace [`usePwaUpdate`](../src/hooks/usePwaUpdate.js) con `virtual:pwa-register/react`.

> Ojo: las funciones `urlPattern` del `runtimeCaching` se serializan **dentro**
> del service worker. Sólo pueden usar literales — nada de variables importadas
> del config (eso rompe el SW con un `ReferenceError` al registrarse).

## Verificar (Chrome de escritorio)

El navegador embebido de las herramientas no registra service workers, así que
esto se comprueba en Chrome real, sobre el build:

```bash
npm run build && npm run preview
```

1. Abrí `http://localhost:4173` → **DevTools → Application → Service Workers**:
   debe figurar `sw.js` como _activated and running_.
2. **Application → Cache Storage**: aparecen `workbox-precache-*`, y `nodo-datos` /
   `nodo-marca` después de navegar por Reservas / Novedades / Carnet.
3. **Network → Offline** y recargá: la app abre igual y muestra los datos
   cacheados.
4. **Lighthouse → Progressive Web App**: instalable, tiene manifest válido,
   responde 200 offline, service worker registrado.

## Antes / después

| Métrica                           | `sw.js` a mano              | Workbox (`vite-plugin-pwa`)      |
| --------------------------------- | --------------------------- | -------------------------------- |
| Precache versionado del build     | manual, lista fija en el SW | automático, con hash por archivo |
| Invalidación de caché vieja       | a mano, por nombre          | `cleanupOutdatedCaches`          |
| Estrategias por tipo de recurso   | `fetch` handler propio      | reglas declarativas de Workbox   |
| Riesgo de servir un chunk viejo   | alto (nombres sin hash)     | nulo (revisión por contenido)    |
| Líneas de código de SW a mantener | ~165                        | 0 (generado)                     |

_(Completá con los puntajes reales de Lighthouse PWA/Performance antes y después
cuando corras la auditoría para la entrega.)_
