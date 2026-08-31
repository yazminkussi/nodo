/* Fuente única de espacios + reservas: reales (sesión activa) o demo.
   Expone la misma interfaz que el store demo para que los componentes de
   reservas casi no cambien. */

import { useCallback, useEffect, useState } from 'react';
import { useNodoStore } from '../store/useNodoStore';
import { useSesion } from '../store/useSesion';
import { horaAmin, minAstring } from '../data/mockData';
import {
  listarEspacios,
  crearEspacio,
  actualizarEspacio,
  eliminarEspacio,
} from '../lib/api/espacios';
import { listarReservas, crearReserva, cancelarReserva } from '../lib/api/reservas';

export function useReservasData() {
  const estado = useSesion((s) => s.estado);
  const comunidadId = useSesion((s) => s.comunidadActivaId);
  const esRemoto = estado === 'activo' && Boolean(comunidadId);

  // --- demo ---
  const demoEspacios = useNodoStore((s) => s.espacios);
  const demoReservas = useNodoStore((s) => s.reservations);
  const demoAddEspacio = useNodoStore((s) => s.addEspacio);
  const demoUpdateEspacio = useNodoStore((s) => s.updateEspacio);
  const demoRemoveEspacio = useNodoStore((s) => s.removeEspacio);
  const demoAddReservation = useNodoStore((s) => s.addReservation);
  const demoCancelReservation = useNodoStore((s) => s.cancelReservation);
  const demoIsSlotTaken = useNodoStore((s) => s.isSlotTaken);

  // --- remoto ---
  const [espacios, setEspacios] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const recargar = useCallback(() => {
    if (!esRemoto) return;
    setCargando(true);
    setError(null);
    Promise.all([listarEspacios(comunidadId), listarReservas(comunidadId)])
      .then(([e, r]) => {
        setEspacios(e);
        setReservas(r);
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
      espacios: demoEspacios,
      reservas: demoReservas,
      addEspacio: demoAddEspacio,
      updateEspacio: demoUpdateEspacio,
      removeEspacio: demoRemoveEspacio,
      addReservation: demoAddReservation,
      cancelReservation: demoCancelReservation,
      isSlotTaken: demoIsSlotTaken,
    };
  }

  const isSlotTaken = (espacioId, fecha, inicio) =>
    reservas.some(
      (r) => r.espacioId === espacioId && r.fecha === fecha && r.inicio <= inicio && r.fin > inicio
    );

  return {
    modo: 'remoto',
    cargando,
    error,
    recargar,
    espacios,
    reservas,
    isSlotTaken,

    addEspacio: async (espacio) => {
      const nuevo = await crearEspacio(comunidadId, espacio);
      setEspacios((prev) => [...prev, nuevo]);
      return nuevo;
    },
    updateEspacio: async (id, patch) => {
      const upd = await actualizarEspacio(id, patch);
      setEspacios((prev) => prev.map((e) => (e.id === id ? upd : e)));
    },
    removeEspacio: async (id) => {
      await eliminarEspacio(id);
      setEspacios((prev) => prev.filter((e) => e.id !== id));
    },

    addReservation: async ({
      espacioId,
      socioId,
      socioNombre,
      fecha,
      inicio,
      duracion = 1,
      concepto,
    }) => {
      const reserva = await crearReserva({
        comunidadId,
        espacioId,
        socioId,
        socioNombre,
        fecha,
        inicio,
        duracion,
        concepto,
      });
      setReservas((prev) => [...prev, reserva]);
      return reserva;
    },
    cancelReservation: async (id) => {
      await cancelarReserva(id);
      setReservas((prev) => prev.filter((r) => r.id !== id));
    },
  };
}

/* Helper: fin de un turno a partir del inicio y la duración. */
export const finTurno = (inicio, duracionHoras) =>
  minAstring(horaAmin(inicio) + duracionHoras * 60);
