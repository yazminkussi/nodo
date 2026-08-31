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
import { reclamarSocio, miSocioDe } from '../lib/api/socios';
import { salir as salirAuth } from '../lib/authService';

export const useSesion = create((set, get) => ({
  estado: supabaseDisponible ? 'cargando' : 'demo',
  session: null,
  perfil: null,
  membresias: [],
  comunidadActivaId: null,
  miSocio: null, // ficha de socio de la cuenta en la comunidad activa

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
        miSocio: null,
      });
      return;
    }
    set({ session, estado: 'activo' });
    // Vincula la ficha de socio por email (si corresponde) antes de leer roles.
    await reclamarSocio();
    await get()._cargarContexto();
  },

  _cargarContexto: async () => {
    const [perfil, membresias] = await Promise.all([cargarPerfil(), cargarMembresias()]);
    const comunidadActivaId = get().comunidadActivaId || membresias[0]?.comunidad?.id || null;
    const miSocio = comunidadActivaId ? await miSocioDe(comunidadActivaId) : null;
    set({ perfil, membresias, comunidadActivaId, miSocio });
  },

  /** Recarga perfil + membresías + ficha propia (p. ej. después de correr el seed). */
  refrescar: async () => {
    if (get().estado !== 'activo') return;
    await reclamarSocio();
    await get()._cargarContexto();
  },

  setComunidadActiva: async (comunidadActivaId) => {
    set({ comunidadActivaId });
    if (get().estado === 'activo') {
      set({ miSocio: await miSocioDe(comunidadActivaId) });
    }
  },

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
      miSocio: null,
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
