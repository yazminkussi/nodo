/* Capa de datos de inscripciones a actividades contra Supabase. */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';
import type { Fila } from './tipos';

export interface InscripcionUI {
  id: string;
  comunidadId: string;
  actividadId: string;
  socioId: string | null;
  socioNombre: string;
  fecha: string;
  estado: string;
}

export function filaAInscripcion(f: Fila): InscripcionUI {
  return {
    id: f.id,
    comunidadId: f.comunidad_id,
    actividadId: f.actividad_id,
    socioId: f.socio_id,
    socioNombre: f.socio_nombre ?? '',
    fecha: f.fecha,
    estado: f.estado,
  };
}

export async function listarInscripciones(comunidadId: string): Promise<InscripcionUI[]> {
  if (!supabaseDisponible || !comunidadId) return [];
  const { data, error } = await requireSupabase()
    .from('inscripciones')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .eq('estado', 'activa');
  if (error) throw error;
  return (data ?? []).map(filaAInscripcion);
}

export interface NuevaInscripcion {
  comunidadId: string;
  actividadId: string;
  socioId?: string | null;
  socioNombre?: string;
}

export async function crearInscripcion({
  comunidadId,
  actividadId,
  socioId,
  socioNombre,
}: NuevaInscripcion): Promise<InscripcionUI> {
  const sb = requireSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const fila: Fila = {
    comunidad_id: comunidadId,
    actividad_id: actividadId,
    socio_id: socioId ?? null,
    perfil_id: user?.id ?? null,
    socio_nombre: socioNombre ?? null,
    estado: 'activa',
  };
  const { data, error } = await sb.from('inscripciones').insert(fila).select().single();
  if (error) {
    if (String(error.message).includes('CUPO_COMPLETO')) {
      throw new Error('Cupo completo. Consultá en recepción por la lista de espera.');
    }
    if (String(error.message).includes('uq_inscripcion_activa') || error.code === '23505') {
      throw new Error('Ya estás inscripto en esta actividad.');
    }
    throw error;
  }
  return filaAInscripcion(data);
}

export async function cancelarInscripcion(id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('inscripciones')
    .update({ estado: 'cancelada' })
    .eq('id', id);
  if (error) throw error;
}
