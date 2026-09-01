/* Capa de datos de reservas contra Supabase. */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';
import { horaAmin, minAstring } from '../../data/mockData';
import type { Fila } from './tipos';

export interface ReservaUI {
  id: string;
  comunidadId: string;
  espacioId: string;
  socioId: string | null;
  socioNombre: string;
  fecha: string;
  inicio: string;
  fin: string;
  estado: string;
  concepto?: string;
}

export function filaAReserva(f: Fila): ReservaUI {
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

export async function listarReservas(
  comunidadId: string,
  opts: { desde?: string } = {}
): Promise<ReservaUI[]> {
  if (!supabaseDisponible || !comunidadId) return [];
  let q = requireSupabase()
    .from('reservas')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .neq('estado', 'cancelada')
    .order('fecha', { ascending: true });
  if (opts.desde) q = q.gte('fecha', opts.desde);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(filaAReserva);
}

export interface NuevaReserva {
  comunidadId: string;
  espacioId: string;
  socioId?: string | null;
  socioNombre?: string;
  fecha: string;
  inicio: string;
  duracion?: number;
  concepto?: string;
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
}: NuevaReserva): Promise<ReservaUI> {
  const sb = requireSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const fila: Fila = {
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
  const { data, error } = await sb.from('reservas').insert(fila).select().single();
  if (error) {
    if (String(error.message).includes('uq_reserva_slot') || error.code === '23505') {
      throw new Error('Ese turno ya está reservado.');
    }
    throw error;
  }
  return filaAReserva(data);
}

export async function cancelarReserva(id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('reservas')
    .update({ estado: 'cancelada' })
    .eq('id', id);
  if (error) throw error;
}
