/* Capa de datos de actividades / talleres contra Supabase. */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';
import type { Fila } from './tipos';

export interface ActividadUI {
  id: string;
  comunidadId: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  instructor: string;
  cupoMaximo: number;
  dias: number[];
  inicio: string;
  duracion: number;
  costoMensual: number;
  color: string;
  icono: string;
  espacioId?: string;
  activa: boolean;
}

export function filaAActividad(f: Fila): ActividadUI {
  return {
    id: f.id,
    comunidadId: f.comunidad_id,
    nombre: f.nombre,
    descripcion: f.descripcion ?? '',
    categoria: f.categoria ?? 'Cultural',
    instructor: f.instructor ?? '',
    cupoMaximo: f.cupo_maximo ?? 0,
    dias: Array.isArray(f.dias) ? f.dias : [],
    inicio: f.inicio ?? '18:00',
    duracion: Number(f.duracion ?? 1),
    costoMensual: f.costo_mensual ?? 0,
    color: f.color ?? '#5E52C4',
    icono: f.icono ?? 'yoga',
    espacioId: f.espacio_id || undefined,
    activa: f.activa ?? true,
  };
}

function actividadAFila(patch: Partial<ActividadUI>): Fila {
  const fila: Fila = {};
  if (patch.nombre !== undefined) fila.nombre = patch.nombre;
  if (patch.descripcion !== undefined) fila.descripcion = patch.descripcion;
  if (patch.categoria !== undefined) fila.categoria = patch.categoria;
  if (patch.instructor !== undefined) fila.instructor = patch.instructor;
  if (patch.cupoMaximo !== undefined) fila.cupo_maximo = patch.cupoMaximo;
  if (patch.dias !== undefined) fila.dias = patch.dias;
  if (patch.inicio !== undefined) fila.inicio = patch.inicio;
  if (patch.duracion !== undefined) fila.duracion = patch.duracion;
  if (patch.costoMensual !== undefined) fila.costo_mensual = patch.costoMensual;
  if (patch.color !== undefined) fila.color = patch.color;
  if (patch.icono !== undefined) fila.icono = patch.icono;
  if (patch.espacioId !== undefined) fila.espacio_id = patch.espacioId || null;
  if (patch.activa !== undefined) fila.activa = patch.activa;
  return fila;
}

export async function listarActividades(comunidadId: string): Promise<ActividadUI[]> {
  if (!supabaseDisponible || !comunidadId) return [];
  const { data, error } = await requireSupabase()
    .from('actividades')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(filaAActividad);
}

export async function crearActividad(
  comunidadId: string,
  actividad: Partial<ActividadUI>
): Promise<ActividadUI> {
  const fila = { ...actividadAFila(actividad), comunidad_id: comunidadId };
  const { data, error } = await requireSupabase()
    .from('actividades')
    .insert(fila)
    .select()
    .single();
  if (error) throw error;
  return filaAActividad(data);
}

export async function actualizarActividad(
  id: string,
  patch: Partial<ActividadUI>
): Promise<ActividadUI> {
  const { data, error } = await requireSupabase()
    .from('actividades')
    .update(actividadAFila(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return filaAActividad(data);
}

export async function eliminarActividad(id: string): Promise<void> {
  const { error } = await requireSupabase().from('actividades').delete().eq('id', id);
  if (error) throw error;
}
