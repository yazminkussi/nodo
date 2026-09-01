/* Equipo de administración: administradores actuales + invitaciones. */

import { supabase, supabaseDisponible } from '../supabaseClient';

/** Convierte las invitaciones pendientes del email en membresías (al iniciar sesión). */
export async function aceptarInvitaciones() {
  if (!supabaseDisponible) return;
  const { error } = await supabase.rpc('aceptar_invitaciones');
  if (error) console.warn('NODO: no se pudieron aceptar invitaciones.', error.message);
}

export async function listarEquipo(comunidadId) {
  if (!supabaseDisponible || !comunidadId) return [];
  const { data, error } = await supabase.rpc('equipo_de', { cid: comunidadId });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    membresiaId: r.membresia_id,
    perfilId: r.perfil_id,
    rol: r.rol,
    categorias: r.categorias ?? [],
    nombre: r.nombre ?? '',
    apellido: r.apellido ?? '',
    email: r.email ?? '',
  }));
}

export async function listarInvitaciones(comunidadId) {
  if (!supabaseDisponible || !comunidadId) return [];
  const { data, error } = await supabase
    .from('invitaciones')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .eq('estado', 'pendiente')
    .order('creada_en', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function crearInvitacion(comunidadId, { email, rol, categorias = [] }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('invitaciones')
    .insert({
      comunidad_id: comunidadId,
      email: email.trim().toLowerCase(),
      rol,
      categorias,
      invitada_por: user?.id ?? null,
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('Ya hay una invitación pendiente para ese email.');
    throw error;
  }
  return data;
}

export async function revocarInvitacion(id) {
  const { error } = await supabase.from('invitaciones').update({ estado: 'revocada' }).eq('id', id);
  if (error) throw error;
}

export async function quitarAdmin(membresiaId) {
  const { error } = await supabase.from('membresias').delete().eq('id', membresiaId);
  if (error) throw error;
}
