/* Cliente Supabase opcional.
   Se activa únicamente cuando existen las variables de entorno:
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
   Si no están configuradas, la app funciona en modo local (mock + zustand). */

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey ? createClient(url, anonKey) : null;

export const supabaseDisponible = Boolean(supabase);