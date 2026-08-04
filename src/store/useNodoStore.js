import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  sociosIniciales,
  espaciosIniciales,
  reservasIniciales,
  publicidadesIniciales,
  novedadesIniciales,
  todayISO,
  nextHour,
} from '../data/mockData';

let toastId = 0;

export const useNodoStore = create(
  persist(
    (set, get) => ({
      /* ---- vista actual ---- */
      role: 'socio',
      setRole: (role) => set({ role }),

      /* ---- socio cuyo carnet se muestra ---- */
      socioActualId: 2,
      setSocioActual: (socioActualId) => set({ socioActualId }),

      /* ---- socios ---- */
      members: sociosIniciales,
      toggleCuotaStatus: (id) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id
              ? { ...m, cuotaAlDia: !m.cuotaAlDia, ultimaCuota: !m.cuotaAlDia ? todayISO() : m.ultimaCuota }
              : m
          ),
        })),

      /* ---- espacios (fijos en el demo) ---- */
      espacios: espaciosIniciales,

      /* ---- novedades ---- */
      novedades: novedadesIniciales,

      /* ---- reservas ---- */
      reservations: reservasIniciales,
      addReservation: ({ espacioId, socioId, socioNombre, fecha, inicio, concepto }) => {
        const reserva = {
          id: Date.now(),
          espacioId,
          socioId,
          socioNombre,
          fecha: fecha || todayISO(),
          inicio,
          fin: `${String(Number(inicio.split(':')[0]) + 1).padStart(2, '0')}:00`,
          estado: 'confirmada',
          concepto: concepto || undefined,
        };
        set((state) => ({ reservations: [...state.reservations, reserva] }));
        return reserva;
      },
      cancelReservation: (id) =>
        set((state) => ({ reservations: state.reservations.filter((r) => r.id !== id) })),
      isSlotTaken: (espacioId, fecha, inicio) =>
        get().reservations.some(
          (r) =>
            r.espacioId === espacioId &&
            r.fecha === fecha &&
            r.inicio <= inicio &&
            r.fin > inicio
        ),

      /* ---- publicidades ---- */
      ads: publicidadesIniciales,
      addAd: (ad) => set((state) => ({ ads: [...state.ads, { id: Date.now(), ...ad }] })),
      removeAd: (id) => set((state) => ({ ads: state.ads.filter((a) => a.id !== id) })),

      /* ---- toasts ---- */
      toasts: [],
      addToast: (mensaje, tipo = 'success') => {
        const id = ++toastId;
        set((state) => ({ toasts: [...state.toasts, { id, mensaje, tipo }] }));
        setTimeout(() => get().removeToast(id), 4000);
      },
      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'nodo-store',
      version: 1,
      partialize: (state) => ({
        role: state.role,
        members: state.members,
        reservations: state.reservations,
        ads: state.ads,
        socioActualId: state.socioActualId,
      }),
    }
  )
);

export const useProximaReserva = (socioId) => {
  const reservations = useNodoStore((s) => s.reservations);
  const espacios = useNodoStore((s) => s.espacios);
  const hoy = todayISO();
  const hoyHora = nextHour();
  const proxima = reservations
    .filter((r) => r.socioId === socioId && (r.fecha > hoy || (r.fecha === hoy && r.inicio >= hoyHora)))
    .sort((a, b) => (a.fecha + a.inicio).localeCompare(b.fecha + b.inicio))[0];
  if (!proxima) return null;
  const espacio = espacios.find((e) => e.id === proxima.espacioId);
  return { ...proxima, espacio };
};
