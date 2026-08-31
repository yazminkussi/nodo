/* Capa de datos de reservas contra Supabase. */

import { supabase, supabaseDisponible } from '../supabaseClient';
import { horaAmin, minAstring } from '../../data/mockData';

export function filaAReserva(f) {
  return {
    id: f.id,
    comunidadId: f.comunidad_id,
    espacioId: f.espacio_id,
    socioId: f.socio_id,
    socioNombre: f.socio_nombre ?? '',
    fecha: f.fecha,
    inicio: f.inicio,
    fin: f.fin,
    estado: f.estado,
    concepto: f.concepto || undefined,
  };
}

export async function listarReservas(comunidadId, { desde } = {}) {
  if (!supabaseDisponible || !comunidadId) return [];
  let q = supabase
    .from('reservas')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .neq('estado', 'cancelada')
    .order('fecha', { ascending: true });
  if (desde) q = q.gte('fecha', desde);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(filaAReserva);
}

export async function crearReserva({
  comunidadId,
  espacioId,
  socioId,
  socioNombre,
  fecha,
  inicio,
  duracion = 1,
  concepto,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fila = {
    comunidad_id: comunidadId,
    espacio_id: espacioId,
    socio_id: socioId ?? null,
    perfil_id: user?.id ?? null,
    socio_nombre: socioNombre ?? null,
    fecha,
    inicio,
    fin: minAstring(horaAmin(inicio) + duracion * 60),
    estado: 'confirmada',
    concepto: concepto || null,
  };
  const { data, error } = await supabase.from('reservas').insert(fila).select().single();
  if (error) {
    if (String(error.message).includes('uq_reserva_slot') || error.code === '23505') {
      throw new Error('Ese turno ya está reservado.');
    }
    throw error;
  }
  return filaAReserva(data);
}

export async function cancelarReserva(id) {
  const { error } = await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', id);
  if (error) throw error;
}
