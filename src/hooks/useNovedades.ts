/* Fuente única de novedades: reales (sesión activa) o demo. */

import { useCallback, useEffect, useState } from 'react';
import { useNodoStore } from '../store/useNodoStore';
import { useSesion } from '../store/useSesion';
import {
  listarNovedades,
  crearNovedad,
  actualizarNovedad,
  eliminarNovedad,
} from '../lib/api/novedades';
import type { NovedadUI } from '../lib/api/novedades';
import type { Novedad } from '../data/mockData';

type NovedadVista = NovedadUI | Novedad;

export interface UseNovedadesResult {
  modo: 'demo' | 'remoto';
  novedades: NovedadVista[];
  cargando: boolean;
  error: unknown;
  recargar: () => void;
  crear: ((novedad: Partial<NovedadUI>) => Promise<NovedadUI>) | null;
  actualizar: ((id: string, patch: Partial<NovedadUI>) => Promise<void>) | null;
  eliminar: ((id: string) => Promise<void>) | null;
}

export function useNovedades(): UseNovedadesResult {
  const estado = useSesion((s) => s.estado);
  const comunidadId = useSesion((s) => s.comunidadActivaId);
  const esRemoto = estado === 'activo' && Boolean(comunidadId);

  const demoNovedades = useNodoStore((s) => s.novedades);

  const [novedades, setNovedades] = useState<NovedadUI[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const recargar = useCallback(() => {
    if (!esRemoto || !comunidadId) return;
    setCargando(true);
    setError(null);
    listarNovedades(comunidadId)
      .then(setNovedades)
      .catch(setError)
      .finally(() => setCargando(false));
  }, [esRemoto, comunidadId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (!esRemoto) {
    return {
      modo: 'demo',
      novedades: demoNovedades,
      cargando: false,
      error: null,
      recargar: () => {},
      crear: null,
      actualizar: null,
      eliminar: null,
    };
  }

  const reemplazar = (n: NovedadUI) =>
    setNovedades((prev) => prev.map((x) => (x.id === n.id ? n : x)));

  return {
    modo: 'remoto',
    novedades,
    cargando,
    error,
    recargar,
    crear: async (novedad) => {
      const nueva = await crearNovedad(comunidadId as string, novedad);
      setNovedades((prev) => [nueva, ...prev]);
      return nueva;
    },
    actualizar: async (id, patch) => reemplazar(await actualizarNovedad(id, patch)),
    eliminar: async (id) => {
      await eliminarNovedad(id);
      setNovedades((prev) => prev.filter((x) => x.id !== id));
    },
  };
}
