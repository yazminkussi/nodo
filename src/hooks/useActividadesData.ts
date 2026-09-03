/* Fuente única de actividades + inscripciones: reales (sesión activa) o demo.
   Expone la misma interfaz que el store demo para que los componentes de
   talleres casi no cambien. */

import { useCallback, useEffect, useState } from 'react';
import { useNodoStore } from '../store/useNodoStore';
import { useSesion } from '../store/useSesion';
import {
  listarActividades,
  crearActividad,
  actualizarActividad,
  eliminarActividad,
} from '../lib/api/actividades';
import type { ActividadUI } from '../lib/api/actividades';
import {
  listarInscripciones,
  crearInscripcion,
  cancelarInscripcion,
} from '../lib/api/inscripciones';
import type { InscripcionUI, NuevaInscripcion } from '../lib/api/inscripciones';

export function useActividadesData() {
  const estado = useSesion((s) => s.estado);
  const comunidadId = useSesion((s) => s.comunidadActivaId);
  const esRemoto = estado === 'activo' && Boolean(comunidadId);

  // --- demo ---
  const demoActividades = useNodoStore((s) => s.actividades);
  const demoInscripciones = useNodoStore((s) => s.inscripciones);
  const demoAddActividad = useNodoStore((s) => s.addActividad);
  const demoUpdateActividad = useNodoStore((s) => s.updateActividad);
  const demoRemoveActividad = useNodoStore((s) => s.removeActividad);
  const demoAddInscripcion = useNodoStore((s) => s.addInscripcion);
  const demoCancelInscripcion = useNodoStore((s) => s.cancelInscripcion);

  // --- remoto ---
  const [actividades, setActividades] = useState<ActividadUI[]>([]);
  const [inscripciones, setInscripciones] = useState<InscripcionUI[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const recargar = useCallback(() => {
    if (!esRemoto || !comunidadId) return;
    setCargando(true);
    setError(null);
    Promise.all([listarActividades(comunidadId), listarInscripciones(comunidadId)])
      .then(([a, i]) => {
        setActividades(a);
        setInscripciones(i);
      })
      .catch(setError)
      .finally(() => setCargando(false));
  }, [esRemoto, comunidadId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (!esRemoto) {
    return {
      modo: 'demo',
      cargando: false,
      error: null,
      recargar: () => {},
      actividades: demoActividades,
      inscripciones: demoInscripciones,
      addActividad: demoAddActividad,
      updateActividad: demoUpdateActividad,
      removeActividad: demoRemoveActividad,
      addInscripcion: demoAddInscripcion,
      cancelInscripcion: demoCancelInscripcion,
    };
  }

  return {
    modo: 'remoto',
    cargando,
    error,
    recargar,
    actividades,
    inscripciones,

    addActividad: async (actividad: Partial<ActividadUI>) => {
      const nueva = await crearActividad(comunidadId as string, actividad);
      setActividades((prev) => [...prev, nueva]);
      return nueva;
    },
    updateActividad: async (id: string, patch: Partial<ActividadUI>) => {
      const upd = await actualizarActividad(id, patch);
      setActividades((prev) => prev.map((a) => (a.id === id ? upd : a)));
    },
    removeActividad: async (id: string) => {
      await eliminarActividad(id);
      setActividades((prev) => prev.filter((a) => a.id !== id));
    },

    addInscripcion: async ({
      actividadId,
      socioId,
      socioNombre,
    }: Omit<NuevaInscripcion, 'comunidadId'>) => {
      const inscripcion = await crearInscripcion({
        comunidadId: comunidadId as string,
        actividadId,
        socioId,
        socioNombre,
      });
      setInscripciones((prev) => [...prev, inscripcion]);
      return inscripcion;
    },
    cancelInscripcion: async (id: string) => {
      await cancelarInscripcion(id);
      setInscripciones((prev) => prev.filter((i) => i.id !== id));
    },
  };
}
