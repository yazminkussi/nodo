/* Autenticación con Supabase.
   Envuelve las llamadas de `supabase.auth` y expone un modo demo cuando
   Supabase no está configurado (la app sigue funcionando con estado local). */

import { supabase, supabaseDisponible } from './supabaseClient';

export { supabaseDisponible };

/** Registro con email + contraseña. Guarda nombre/apellido en el metadata
    para que el trigger `handle_new_user` complete el perfil. */
export async function registrarse({ email, password, nombre, apellido }) {
  if (!supabaseDisponible) return { ok: false, error: 'Supabase no configurado' };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre: nombre || '', apellido: apellido || '' } },
  });
  if (error) return { ok: false, error: traducirError(error.message) };
  return { ok: true, data, necesitaConfirmacion: !data.session };
}

/** Ingreso con email + contraseña. */
export async function ingresar({ email, password }) {
  if (!supabaseDisponible) return { ok: false, error: 'Supabase no configurado' };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: traducirError(error.message) };
  return { ok: true, data };
}

/** Enlace mágico (sin contraseña). */
export async function enviarEnlaceMagico({ email }) {
  if (!supabaseDisponible) return { ok: false, error: 'Supabase no configurado' };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return { ok: false, error: traducirError(error.message) };
  return { ok: true };
}

/** Recuperar contraseña. */
export async function recuperarContrasena({ email }) {
  if (!supabaseDisponible) return { ok: false, error: 'Supabase no configurado' };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) return { ok: false, error: traducirError(error.message) };
  return { ok: true };
}

export async function salir() {
  if (!supabaseDisponible) return { ok: true };
  const { error } = await supabase.auth.signOut();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function sesionActual() {
  if (!supabaseDisponible) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/* Traduce los mensajes más comunes de GoTrue al español. */
function traducirError(msg = '') {
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
