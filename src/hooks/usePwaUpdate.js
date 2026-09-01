/* Actualización de la PWA.
   Envuelve `useRegisterSW` de vite-plugin-pwa y mantiene la misma interfaz que
   consumía el banner: cuando hay una versión nueva del service worker,
   `actualizacionDisponible` pasa a true; al aceptar, se instala y la app se
   recarga sola (el plugin dispara el reload al tomar el control). */

import { useCallback, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePwaUpdate() {
  const [instalando, setInstalando] = useState(false);

  const {
    needRefresh: [actualizacionDisponible],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      console.warn('NODO: no se pudo registrar el service worker.', err);
    },
  });

  const aplicarActualizacion = useCallback(async () => {
    setInstalando(true);
    try {
      await updateServiceWorker(true);
    } finally {
      setInstalando(false);
    }
  }, [updateServiceWorker]);

  return { actualizacionDisponible, instalando, aplicarActualizacion };
}
