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

export function useNovedades() {
  const estado = useSesion((s) => s.estado);
  const comunidadId = useSesion((s) => s.comunidadActivaId);
  const esRemoto = estado === 'activo' && Boolean(comunidadId);

  const demoNovedades = useNodoStore((s) => s.novedades);

  const [novedades, setNovedades] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const recargar = useCallback(() => {
    if (!esRemoto) return;
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

  const reemplazar = (n) => setNovedades((prev) => prev.map((x) => (x.id === n.id ? n : x)));

  return {
    modo: 'remoto',
    novedades,
    cargando,
    error,
    recargar,
    crear: async (novedad) => {
      const nueva = await crearNovedad(comunidadId, novedad);
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
