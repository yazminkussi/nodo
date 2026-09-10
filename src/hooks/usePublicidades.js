/* Fuente única de publicidades: reales (sesión activa) o demo. */

import { useCallback, useEffect, useState } from 'react';
import { useNodoStore } from '../store/useNodoStore';
import { useSesion } from '../store/useSesion';
import { listarPublicidades, crearPublicidad, eliminarPublicidad } from '../lib/api/publicidades';

export function usePublicidades() {
  const estado = useSesion((s) => s.estado);
  const comunidadId = useSesion((s) => s.comunidadActivaId);
  const esRemoto = estado === 'activo' && Boolean(comunidadId);

  const demoAds = useNodoStore((s) => s.ads);
  const demoAddAd = useNodoStore((s) => s.addAd);
  const demoRemoveAd = useNodoStore((s) => s.removeAd);

  const [ads, setAds] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const recargar = useCallback(() => {
    if (!esRemoto || !comunidadId) return;
    setCargando(true);
    setError(null);
    listarPublicidades(comunidadId)
      .then(setAds)
      .catch(setError)
      .finally(() => setCargando(false));
  }, [esRemoto, comunidadId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (!esRemoto) {
    return {
      modo: 'demo',
      ads: demoAds,
      cargando: false,
      error: null,
      recargar: () => {},
      crear: async (ad) => demoAddAd(ad),
      eliminar: async (id) => demoRemoveAd(id),
    };
  }

  return {
    modo: 'remoto',
    ads,
    cargando,
    error,
    recargar,
    crear: async (ad) => {
      const nueva = await crearPublicidad(comunidadId, ad);
      setAds((prev) => [...prev, nueva].sort((a, b) => Number(b.destacada) - Number(a.destacada)));
      return nueva;
    },
    eliminar: async (id) => {
      await eliminarPublicidad(id);
      setAds((prev) => prev.filter((a) => a.id !== id));
    },
  };
}
