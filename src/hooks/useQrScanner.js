/* Hook de escaneo QR por cámara (WebRTC) basado en html5-qrcode.
   Gestiona: arranque/parada, cámara trasera (environment), alternancia
   frontal/trasera, linterna (torch) cuando el dispositivo lo soporta y
   pausa/reanudación del escaneo mientras se muestra el resultado.

   Se carga con import dinámico para mantener el bundle del build liviano y
   evitar conflictos de resolución de módulos en Vite. */

import { useCallback, useEffect, useRef, useState } from 'react';

let moduloPromise = null;

function cargarModulo() {
  if (!moduloPromise) {
    moduloPromise = import('html5-qrcode').then((m) => m.Html5Qrcode);
  }
  return moduloPromise;
}

const configBasica = {
  fps: 10,
  qrbox: (w, h) => {
    const lado = Math.floor(Math.min(w, h) * 0.7);
    return { width: lado, height: lado };
  },
  aspectRatio: 1.0,
};

function normalizarError(err) {
  const msg = err?.message || String(err || '');
  if (/NotAllowedError|Permission denied|denied|bloquead/i.test(msg)) {
    return 'Permiso de cámara denegado. Habilitá la cámara desde el navegador y volvé a intentar.';
  }
  if (/NotFoundError|no camera|No camera|camera not found|no encontrad/i.test(msg)) {
    return 'No se detectó ninguna cámara en este dispositivo.';
  }
  if (/NotReadableError|Could not start|could not start|en uso/i.test(msg)) {
    return 'No se pudo acceder a la cámara. Cerrá otras apps que la usen e intentá de nuevo.';
  }
  if (/hardware/i.test(msg)) {
    return 'Error de hardware de cámara. Probá con el ingreso manual.';
  }
  return msg || 'Error inesperado al iniciar la cámara.';
}

async function detenerSilencioso(scannerRef, detenidoRef) {
  detenidoRef.current = true;
  const scanner = scannerRef.current;
  scannerRef.current = null;
  if (scanner) {
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      /* ignore */
    }
  }
}

export function useQrScanner(elementId) {
  const scannerRef = useRef(null);
  const onResultRef = useRef(null);
  const detenidoRef = useRef(false);

  const [estado, setEstado] = useState('idle'); // idle | iniciando | escaneando | detenido | error
  const [error, setError] = useState(null);
  const [camaraFrontal, setCamaraFrontal] = useState(false);
  const [linternaDisponible, setLinternaDisponible] = useState(false);
  const [linternaEncendida, setLinternaEncendida] = useState(false);
  const [nCamaras, setNCamaras] = useState(0);

  useEffect(() => {
    return () => {
      detenerSilencioso(scannerRef, detenidoRef);
    };
  }, []);

  const detener = useCallback(async () => {
    await detenerSilencioso(scannerRef, detenidoRef);
    setEstado('detenido');
    setLinternaEncendida(false);
    setLinternaDisponible(false);
  }, []);

  const iniciar = useCallback(
    async (onResult, facing = 'environment') => {
      if (scannerRef.current) await detener();
      if (!onResult) return;
      onResultRef.current = onResult;
      detenidoRef.current = false;

      setError(null);
      setEstado('iniciando');

      try {
        const Html5Qrcode = await cargarModulo();
        const scanner = new Html5Qrcode(elementId, false);
        scannerRef.current = scanner;
        setCamaraFrontal(facing !== 'environment');
        setLinternaEncendida(false);

        await scanner.start(
          { facingMode: facing === 'environment' ? 'environment' : 'user' },
          configBasica,
          (texto) => {
            if (detenidoRef.current || !onResultRef.current) return;
            onResultRef.current(texto);
          },
          () => {}
        );

        if (detenidoRef.current) {
          await detenerSilencioso(scannerRef, detenidoRef);
          return;
        }

        setEstado('escaneando');

        try {
          Html5Qrcode.getCameras()
            .then((camaras) => {
              setNCamaras(camaras?.length || 0);
            })
            .catch(() => setNCamaras(0));
        } catch {
          setNCamaras(0);
        }

        try {
          await scanner.applyVideoConstraints({ advanced: [{ torch: false }] });
          setLinternaDisponible(true);
        } catch {
          setLinternaDisponible(false);
        }
      } catch (err) {
        setEstado('error');
        setError(normalizarError(err));
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch {
            /* ignore */
          }
          scannerRef.current = null;
        }
      }
    },
    [elementId, detener]
  );

  const alternarCamara = useCallback(async () => {
    const scanner = scannerRef.current;
    const siguienteFrontal = !camaraFrontal;
    if (!scanner || !scanner.isScanning) return;
    try {
      await scanner.applyVideoConstraints({
        facingMode: siguienteFrontal ? 'user' : 'environment',
        advanced: [{ torch: linternaEncendida }],
      });
      setCamaraFrontal(siguienteFrontal);
      setLinternaEncendida(false);
    } catch {
      /* constraint no soportada en este dispositivo */
    }
  }, [camaraFrontal, linternaEncendida]);

  const alternarLinterna = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner || !scanner.isScanning) return;
    const siguiente = !linternaEncendida;
    try {
      await scanner.applyVideoConstraints({ advanced: [{ torch: siguiente }] });
      setLinternaEncendida(siguiente);
    } catch {
      setLinternaDisponible(false);
      setLinternaEncendida(false);
    }
  }, [linternaEncendida]);

  const pausar = useCallback(() => {
    if (scannerRef.current?.isScanning) scannerRef.current.pause();
  }, []);

  const reanudar = useCallback(() => {
    if (scannerRef.current?.isScanning) scannerRef.current.resume();
  }, []);

  return {
    estado,
    error,
    camaraFrontal,
    linternaDisponible,
    linternaEncendida,
    nCamaras,
    iniciar,
    detener,
    alternarCamara,
    alternarLinterna,
    pausar,
    reanudar,
  };
}
