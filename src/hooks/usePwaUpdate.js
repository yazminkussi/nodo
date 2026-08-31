/* Hook de actualización automática de la PWA.
   Detecta una versión nueva del service worker (nueva versión del build) y
   expone el estado para mostrar un banner "Actualizar". Al aceptar, fuerza la
   instalación del SW nuevo y recarga la app con los assets frescos.

   También fuerza la revalidación en background de los assets de marca (logo)
   para que las PWAs instaladas muestren el logo actualizado sin reinstalar. */

import { useCallback, useEffect, useRef, useState } from 'react';

const SW_PATH = `${import.meta.env.BASE_URL || ''}sw.js`;

export function usePwaUpdate() {
  const [actualizacionDisponible, setActualizacionDisponible] = useState(false);
  const [instalando, setInstalando] = useState(false);
  const registroRef = useRef(null);
  const waitingRef = useRef(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    const onUpdateFound = () => {
      const reg = registroRef.current;
      if (!reg) return;
      const nuevo = reg.installing;
      if (!nuevo) return;
      waitingRef.current = null;
      nuevo.addEventListener('statechange', () => {
        if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
          waitingRef.current = nuevo;
          setActualizacionDisponible(true);
        }
      });
    };

    navigator.serviceWorker.ready.then((reg) => {
      registroRef.current = reg;
      if (reg.waiting) {
        waitingRef.current = reg.waiting;
        setActualizacionDisponible(true);
      }
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // El SW nuevo tomó el control: recargamos para usar los assets frescos.
      window.location.reload();
    });

    navigator.serviceWorker
      .register(SW_PATH)
      .then((reg) => {
        registroRef.current = reg;
        reg.addEventListener('updatefound', onUpdateFound);
      })
      .catch((err) => console.warn('NODO: no se pudo registrar el SW.', err));

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', () =>
        window.location.reload()
      );
    };
  }, []);

  const aplicarActualizacion = useCallback(async () => {
    setInstalando(true);
    try {
      if (waitingRef.current) {
        waitingRef.current.postMessage({ type: 'SKIP_WAITING' });
      } else if (registroRef.current) {
        await registroRef.current.update();
      }
      setActualizacionDisponible(false);
    } finally {
      setInstalando(false);
    }
  }, []);

  return { actualizacionDisponible, instalando, aplicarActualizacion };
}
