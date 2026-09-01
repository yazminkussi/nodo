/* Capa de datos de espacios contra Supabase. */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';
import { HORARIO_DEFECTO } from '../../data/mockData';
import type { Fila, HorarioConfig } from './tipos';

export interface EspacioUI {
  id: string;
  comunidadId: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioHora: number;
  icono: string;
  color: string;
  categoria: string;
  disponible: boolean;
  horario: HorarioConfig;
}

export function filaAEspacio(f: Fila): EspacioUI {
  return {
    id: f.id,
    comunidadId: f.comunidad_id,
    nombre: f.nombre,
    descripcion: f.descripcion ?? '',
    capacidad: f.capacidad ?? 0,
    precioHora: f.precio_hora ?? 0,
    icono: f.icono ?? 'sum',
    color: f.color ?? '#5E52C4',
    categoria: f.categoria ?? 'Deportivo',
    disponible: f.disponible ?? true,
    horario: { ...HORARIO_DEFECTO, ...(f.horario || {}) },
  };
}

function espacioAFila(patch: Partial<EspacioUI>): Fila {
  const fila: Fila = {};
  if (patch.nombre !== undefined) fila.nombre = patch.nombre;
  if (patch.descripcion !== undefined) fila.descripcion = patch.descripcion;
  if (patch.capacidad !== undefined) fila.capacidad = patch.capacidad;
  if (patch.precioHora !== undefined) fila.precio_hora = patch.precioHora;
  if (patch.icono !== undefined) fila.icono = patch.icono;
  if (patch.color !== undefined) fila.color = patch.color;
  if (patch.categoria !== undefined) fila.categoria = patch.categoria;
  if (patch.disponible !== undefined) fila.disponible = patch.disponible;
  if (patch.horario !== undefined) fila.horario = patch.horario;
  return fila;
}

export async function listarEspacios(comunidadId: string): Promise<EspacioUI[]> {
  if (!supabaseDisponible || !comunidadId) return [];
  const { data, error } = await requireSupabase()
    .from('espacios')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(filaAEspacio);
}

export async function crearEspacio(
  comunidadId: string,
  espacio: Partial<EspacioUI>
): Promise<EspacioUI> {
  const fila = { ...espacioAFila(espacio), comunidad_id: comunidadId };
  const { data, error } = await requireSupabase().from('espacios').insert(fila).select().single();
  if (error) throw error;
  return filaAEspacio(data);
}

export async function actualizarEspacio(id: string, patch: Partial<EspacioUI>): Promise<EspacioUI> {
  const { data, error } = await requireSupabase()
    .from('espacios')
    .update(espacioAFila(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return filaAEspacio(data);
}

export async function eliminarEspacio(id: string): Promise<void> {
  const { error } = await requireSupabase().from('espacios').delete().eq('id', id);
  if (error) throw error;
}
