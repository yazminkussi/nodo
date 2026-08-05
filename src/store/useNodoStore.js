import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  sociosIniciales,
  espaciosIniciales,
  actividadesIniciales,
  inscripcionesIniciales,
  reservasIniciales,
  publicidadesIniciales,
  novedadesIniciales,
  comunidadesIniciales,
  driveItemsIniciales,
  todayISO,
  nextHour,
  horaAmin,
  minAstring,
} from '../data/mockData';

let toastId = 0;

export const useNodoStore = create(
  persist(
    (set, get) => ({
      /* ---- vista actual ---- */
      role: 'socio',
      setRole: (role) => set({ role }),

      /* ---- administrador activo (multi-rol) ---- */
      adminRole: 'superadmin',
      setAdminRole: (adminRole) => set({ adminRole }),

      /* ---- comunidad / inquilino activo (multi-tenant) ---- */
      comunidades: comunidadesIniciales,
      comunidadActualId: comunidadesIniciales[0].id,
      setComunidadActual: (comunidadActualId) => set({ comunidadActualId }),
      updateComunidad: (id, patch) =>
        set((state) => ({
          comunidades: state.comunidades.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

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

      /* ---- espacios (CRUD V3) ---- */
      espacios: espaciosIniciales,
      addEspacio: (espacio) =>
        set((state) => ({ espacios: [...state.espacios, { ...espacio, id: Date.now() }] })),
      updateEspacio: (id, patch) =>
        set((state) => ({
          espacios: state.espacios.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      removeEspacio: (id) =>
        set((state) => ({ espacios: state.espacios.filter((e) => e.id !== id) })),

      /* ---- actividades (CRUD V3) ---- */
      actividades: actividadesIniciales,
      addActividad: (actividad) =>
        set((state) => ({ actividades: [...state.actividades, { ...actividad, id: Date.now() }] })),
      updateActividad: (id, patch) =>
        set((state) => ({
          actividades: state.actividades.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      removeActividad: (id) =>
        set((state) => ({ actividades: state.actividades.filter((a) => a.id !== id) })),

      /* ---- inscripciones a actividades ---- */
      inscripciones: inscripcionesIniciales,
      addInscripcion: ({ actividadId, socioId, socioNombre }) => {
        const inscripcion = {
          id: Date.now(),
          actividadId,
          socioId,
          socioNombre,
          fecha: todayISO(),
          estado: 'activa',
        };
        set((state) => ({ inscripciones: [...state.inscripciones, inscripcion] }));
        return inscripcion;
      },
      cancelInscripcion: (id) =>
        set((state) => ({
          inscripciones: state.inscripciones.map((i) =>
            i.id === id ? { ...i, estado: 'cancelada' } : i
          ),
        })),
      isInscripto: (actividadId, socioId) =>
        get().inscripciones.some(
          (i) => i.actividadId === actividadId && i.socioId === socioId && i.estado === 'activa'
        ),
      inscriptosDe: (actividadId) =>
        get().inscripciones.filter((i) => i.actividadId === actividadId && i.estado === 'activa'),

      /* ---- novedades ---- */
      novedades: novedadesIniciales,

      /* ---- reservas ---- */
      reservations: reservasIniciales,
      addReservation: ({ espacioId, socioId, socioNombre, fecha, inicio, concepto, duracion = 1 }) => {
        const reserva = {
          id: Date.now(),
          espacioId,
          socioId,
          socioNombre,
          fecha: fecha || todayISO(),
          inicio,
          fin: minAstring(horaAmin(inicio) + duracion * 60),
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

      /* ---- NODO Drive (documentos internos) ---- */
      driveItems: driveItemsIniciales,
      addDriveItem: (item) =>
        set((state) => ({ driveItems: [...state.driveItems, { ...item, id: item.id ?? Date.now() }] })),
      updateDriveItem: (id, patch) =>
        set((state) => ({
          driveItems: state.driveItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      removeDriveItem: (id) =>
        set((state) => ({ driveItems: state.driveItems.filter((i) => i.id !== id) })),

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
      version: 3,
      partialize: (state) => ({
        role: state.role,
        adminRole: state.adminRole,
        comunidades: state.comunidades,
        comunidadActualId: state.comunidadActualId,
        members: state.members,
        espacios: state.espacios,
        actividades: state.actividades,
        inscripciones: state.inscripciones,
        reservations: state.reservations,
        ads: state.ads,
        driveItems: state.driveItems,
        socioActualId: state.socioActualId,
      }),
    }
  )
);

export const useComunidadActual = () =>
  useNodoStore((s) => s.comunidades.find((c) => c.id === s.comunidadActualId) || s.comunidades[0]);

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
