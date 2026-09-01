/* Datos de la sesión: perfil del usuario y sus membresías (comunidad + rol). */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';
import type { Perfil, Membresia } from './tipos';

/** Perfil del usuario logueado (fila de `public.perfiles`). */
export async function cargarPerfil(): Promise<Perfil | null> {
  if (!supabaseDisponible) return null;
  const { data, error } = await requireSupabase().from('perfiles').select('*').maybeSingle();
  if (error) {
    console.warn('NODO: no se pudo cargar el perfil.', error.message);
    return null;
  }
  return (data as Perfil | null) ?? null;
}

/** Membresías del usuario, con los datos de cada comunidad. */
export async function cargarMembresias(): Promise<Membresia[]> {
  if (!supabaseDisponible) return [];
  const { data, error } = await requireSupabase()
    .from('membresias')
    .select('id, rol, categorias, estado, comunidad:comunidades(*)')
    .eq('estado', 'activa');
  if (error) {
    console.warn('NODO: no se pudieron cargar las membresías.', error.message);
    return [];
  }
  return ((data ?? []) as unknown as Membresia[]).map((m) => ({
    ...m,
    comunidad: Array.isArray(m.comunidad) ? (m.comunidad[0] ?? null) : m.comunidad,
  }));
}
