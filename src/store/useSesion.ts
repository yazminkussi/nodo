/* Estado de sesión (no se persiste: Supabase maneja su propio almacenamiento).

   estado:
     'cargando'  — todavía no sabemos si hay sesión
     'demo'      — Supabase no está configurado; la app corre con datos locales
     'anonimo'   — Supabase configurado y sin sesión → mostrar login
     'activo'    — hay sesión válida
*/

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseDisponible } from '../lib/supabaseClient';
import { cargarPerfil, cargarMembresias } from '../lib/api/sesion';
import { reclamarSocio, miSocioDe } from '../lib/api/socios';
import type { SocioUI } from '../lib/api/socios';
import { aceptarInvitaciones } from '../lib/api/equipo';
import { salir as salirAuth } from '../lib/authService';
import type { Perfil, Membresia, RolMembresia } from '../lib/api/tipos';

export type EstadoSesion = 'cargando' | 'demo' | 'anonimo' | 'activo';

interface SesionState {
  estado: EstadoSesion;
  session: Session | null;
  perfil: Perfil | null;
  membresias: Membresia[];
  comunidadActivaId: string | null;
  miSocio: SocioUI | null;

  init: () => Promise<void>;
  _aplicarSession: (session: Session | null) => Promise<void>;
  _cargarContexto: () => Promise<void>;
  refrescar: () => Promise<void>;
  setComunidadActiva: (comunidadActivaId: string) => Promise<void>;
  entrarModoDemo: () => void;
  salirModoDemo: () => void;
  salir: () => Promise<void>;
}

const VACIO = {
  session: null,
  perfil: null,
  membresias: [] as Membresia[],
  comunidadActivaId: null,
  miSocio: null,
};

export const useSesion = create<SesionState>((set, get) => ({
  estado: supabaseDisponible ? 'cargando' : 'demo',
  ...VACIO,

  /** Se llama una vez al montar la app. */
  init: async () => {
    if (!supabaseDisponible || !supabase) {
      set({ estado: 'demo' });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    await get()._aplicarSession(session);

    supabase.auth.onAuthStateChange((_evento, nuevaSession) => {
      // Si la persona eligió "modo demo" a mano, no la sacamos de ahí.
      if (get().estado === 'demo') return;
      get()._aplicarSession(nuevaSession);
    });
  },

  _aplicarSession: async (session) => {
    if (!session) {
      set({ estado: 'anonimo', ...VACIO });
      return;
    }
    set({ session, estado: 'activo' });
    // Vincula la ficha de socio por email (si corresponde) antes de leer roles.
    await Promise.all([reclamarSocio(), aceptarInvitaciones()]);
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
    await Promise.all([reclamarSocio(), aceptarInvitaciones()]);
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
    set({ estado: 'anonimo', ...VACIO });
  },
}));

/* ---- selectores derivados ---- */

export const useMembresiaActiva = (): Membresia | null =>
  useSesion((s) => s.membresias.find((m) => m.comunidad?.id === s.comunidadActivaId) || null);

export const useComunidadActiva = () => useMembresiaActiva()?.comunidad || null;

export const useRolActivo = (): RolMembresia | null => useMembresiaActiva()?.rol || null;

export const useEsAdmin = (): boolean => {
  const rol = useRolActivo();
  return rol === 'superadmin' || rol === 'deportes' || rol === 'talleres';
};
