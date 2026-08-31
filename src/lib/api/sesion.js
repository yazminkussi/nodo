/* Datos de la sesión: perfil del usuario y sus membresías (comunidad + rol). */

import { supabase, supabaseDisponible } from '../supabaseClient';

/** Perfil del usuario logueado (fila de `public.perfiles`). */
export async function cargarPerfil() {
  if (!supabaseDisponible) return null;
  const { data, error } = await supabase.from('perfiles').select('*').maybeSingle();
  if (error) {
    console.warn('NODO: no se pudo cargar el perfil.', error.message);
    return null;
  }
  return data;
}

/** Membresías del usuario, con los datos de cada comunidad. */
export async function cargarMembresias() {
  if (!supabaseDisponible) return [];
  const { data, error } = await supabase
    .from('membresias')
    .select('id, rol, categorias, estado, comunidad:comunidades(*)')
    .eq('estado', 'activa');
  if (error) {
    console.warn('NODO: no se pudieron cargar las membresías.', error.message);
    return [];
  }
  return data ?? [];
}
