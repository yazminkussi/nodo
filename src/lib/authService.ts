/* Autenticación con Supabase.
   Envuelve las llamadas de `supabase.auth` y expone un modo demo cuando
   Supabase no está configurado (la app sigue funcionando con estado local). */

import type { Session } from '@supabase/supabase-js';
import { supabaseDisponible, requireSupabase } from './supabaseClient';

export { supabaseDisponible };

interface Credenciales {
  email: string;
  password: string;
}
interface Registro extends Credenciales {
  nombre?: string;
  apellido?: string;
}

type Resultado<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const NO_CONFIG = { ok: false, error: 'Supabase no configurado' } as const;

/** Registro con email + contraseña. */
export async function registrarse({
  email,
  password,
  nombre,
  apellido,
}: Registro): Promise<Resultado<{ data: unknown; necesitaConfirmacion: boolean }>> {
  if (!supabaseDisponible) return NO_CONFIG;
  const { data, error } = await requireSupabase().auth.signUp({
    email,
    password,
    options: { data: { nombre: nombre || '', apellido: apellido || '' } },
  });
  if (error) return { ok: false, error: traducirError(error.message) };
  return { ok: true, data, necesitaConfirmacion: !data.session };
}

/** Ingreso con email + contraseña. */
export async function ingresar({
  email,
  password,
}: Credenciales): Promise<Resultado<{ data: unknown }>> {
  if (!supabaseDisponible) return NO_CONFIG;
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: traducirError(error.message) };
  return { ok: true, data };
}

/** Enlace mágico (sin contraseña). */
export async function enviarEnlaceMagico({ email }: { email: string }): Promise<Resultado> {
  if (!supabaseDisponible) return NO_CONFIG;
  const { error } = await requireSupabase().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return { ok: false, error: traducirError(error.message) };
  return { ok: true };
}

/** Recuperar contraseña. */
export async function recuperarContrasena({ email }: { email: string }): Promise<Resultado> {
  if (!supabaseDisponible) return NO_CONFIG;
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) return { ok: false, error: traducirError(error.message) };
  return { ok: true };
}

export async function salir(): Promise<Resultado> {
  if (!supabaseDisponible) return { ok: true };
  const { error } = await requireSupabase().auth.signOut();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function sesionActual(): Promise<Session | null> {
  if (!supabaseDisponible) return null;
  const { data } = await requireSupabase().auth.getSession();
  return data.session ?? null;
}

/* Traduce los mensajes más comunes de GoTrue al español. */
function traducirError(msg = ''): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Confirmá tu email antes de ingresar.';
  if (m.includes('user already registered')) return 'Ya existe una cuenta con ese email.';
  if (m.includes('password should be at least'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('unable to validate email address')) return 'El email no es válido.';
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Demasiados intentos. Esperá unos minutos.';
  return msg || 'Ocurrió un error. Probá de nuevo.';
}
