/* Estado de sesión (no se persiste: Supabase maneja su propio almacenamiento).

   estado:
     'cargando'  — todavía no sabemos si hay sesión
     'demo'      — Supabase no está configurado; la app corre con datos locales
     'anonimo'   — Supabase configurado y sin sesión → mostrar login
     'activo'    — hay sesión válida
*/

import { create } from 'zustand';
import { supabase, supabaseDisponible } from '../lib/supabaseClient';
import { cargarPerfil, cargarMembresias } from '../lib/api/sesion';
import { salir as salirAuth } from '../lib/authService';

export const useSesion = create((set, get) => ({
  estado: supabaseDisponible ? 'cargando' : 'demo',
  session: null,
  perfil: null,
  membresias: [],
  comunidadActivaId: null,

  /** Se llama una vez al montar la app. */
  init: async () => {
    if (!supabaseDisponible) {
      set({ estado: 'demo' });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    await get()._aplicarSession(session);

    supabase.auth.onAuthStateChange((_evento, nuevaSession) => {
      get()._aplicarSession(nuevaSession);
    });
  },

  _aplicarSession: async (session) => {
    if (!session) {
      set({
        estado: 'anonimo',
        session: null,
        perfil: null,
        membresias: [],
        comunidadActivaId: null,
      });
      return;
    }
    set({ session, estado: 'activo' });
    const [perfil, membresias] = await Promise.all([cargarPerfil(), cargarMembresias()]);
    const comunidadActivaId = get().comunidadActivaId || membresias[0]?.comunidad?.id || null;
    set({ perfil, membresias, comunidadActivaId });
  },

  /** Recarga perfil + membresías (p. ej. después de correr el seed). */
  refrescar: async () => {
    if (get().estado !== 'activo') return;
    const [perfil, membresias] = await Promise.all([cargarPerfil(), cargarMembresias()]);
    set((s) => ({
      perfil,
      membresias,
      comunidadActivaId: s.comunidadActivaId || membresias[0]?.comunidad?.id || null,
    }));
  },

  setComunidadActiva: (comunidadActivaId) => set({ comunidadActivaId }),

  /** Escape hatch: explorar la app con datos locales aunque Supabase esté
      configurado (útil para demos sin conexión). Sólo dura la sesión del navegador. */
  entrarModoDemo: () => set({ estado: 'demo' }),

  /** Vuelve del modo demo a la pantalla de login. */
  salirModoDemo: () => set({ estado: supabaseDisponible ? 'anonimo' : 'demo' }),

  salir: async () => {
    await salirAuth();
    set({
      estado: 'anonimo',
      session: null,
      perfil: null,
      membresias: [],
      comunidadActivaId: null,
    });
  },
}));

/* ---- selectores derivados ---- */

export const useMembresiaActiva = () =>
  useSesion((s) => s.membresias.find((m) => m.comunidad?.id === s.comunidadActivaId) || null);

export const useComunidadActiva = () => useMembresiaActiva()?.comunidad || null;

export const useRolActivo = () => useMembresiaActiva()?.rol || null;

export const useEsAdmin = () => {
  const rol = useRolActivo();
  return rol === 'superadmin' || rol === 'deportes' || rol === 'talleres';
};
