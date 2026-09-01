/* Equipo de administración: administradores actuales + invitaciones. */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';
import type { Fila, MiembroEquipo, RolMembresia } from './tipos';

/** Convierte las invitaciones pendientes del email en membresías (al iniciar sesión). */
export async function aceptarInvitaciones(): Promise<void> {
  if (!supabaseDisponible) return;
  const { error } = await requireSupabase().rpc('aceptar_invitaciones');
  if (error) console.warn('NODO: no se pudieron aceptar invitaciones.', error.message);
}

export async function listarEquipo(comunidadId: string): Promise<MiembroEquipo[]> {
  if (!supabaseDisponible || !comunidadId) return [];
  const { data, error } = await requireSupabase().rpc('equipo_de', { cid: comunidadId });
  if (error) throw error;
  return ((data ?? []) as Fila[]).map((r) => ({
    membresiaId: r.membresia_id,
    perfilId: r.perfil_id,
    rol: r.rol,
    categorias: r.categorias ?? [],
    nombre: r.nombre ?? '',
    apellido: r.apellido ?? '',
    email: r.email ?? '',
  }));
}

export async function listarInvitaciones(comunidadId: string): Promise<Fila[]> {
  if (!supabaseDisponible || !comunidadId) return [];
  const { data, error } = await requireSupabase()
    .from('invitaciones')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .eq('estado', 'pendiente')
    .order('creada_en', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function crearInvitacion(
  comunidadId: string,
  { email, rol, categorias = [] }: { email: string; rol: RolMembresia; categorias?: string[] }
): Promise<Fila> {
  const sb = requireSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const { data, error } = await sb
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

export async function revocarInvitacion(id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('invitaciones')
    .update({ estado: 'revocada' })
    .eq('id', id);
  if (error) throw error;
}

export async function quitarAdmin(membresiaId: string): Promise<void> {
  const { error } = await requireSupabase().from('membresias').delete().eq('id', membresiaId);
  if (error) throw error;
}
