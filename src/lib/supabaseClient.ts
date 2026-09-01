/* Cliente Supabase opcional.
   Se activa únicamente cuando existen las variables de entorno:
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
   Si no están configuradas, la app funciona en modo local (mock + zustand). */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const supabaseDisponible = Boolean(supabase);

/** Devuelve el cliente o lanza si Supabase no está configurado. Usar después
    de chequear `supabaseDisponible`. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase no está configurado.');
  return supabase;
}
