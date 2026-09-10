/* Capa de datos de publicidades de comercios contra Supabase. */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';
import type { Fila } from './tipos';

export interface PublicidadUI {
  id: string;
  comunidadId: string;
  negocio: string;
  rubro: string;
  descuento: string;
  descripcion: string;
  color: string;
  barrio: string;
  destacada: boolean;
}

export function filaAPublicidad(f: Fila): PublicidadUI {
  return {
    id: f.id,
    comunidadId: f.comunidad_id,
    negocio: f.negocio,
    rubro: f.rubro ?? 'Comercio local',
    descuento: f.descuento ?? '',
    descripcion: f.descripcion ?? '',
    color: f.color ?? '#059669',
    barrio: f.barrio ?? '',
    destacada: f.destacada ?? false,
  };
}

function publicidadAFila(patch: Partial<PublicidadUI>): Fila {
  const fila: Fila = {};
  if (patch.negocio !== undefined) fila.negocio = patch.negocio;
  if (patch.rubro !== undefined) fila.rubro = patch.rubro;
  if (patch.descuento !== undefined) fila.descuento = patch.descuento;
  if (patch.descripcion !== undefined) fila.descripcion = patch.descripcion;
  if (patch.color !== undefined) fila.color = patch.color;
  if (patch.barrio !== undefined) fila.barrio = patch.barrio;
  if (patch.destacada !== undefined) fila.destacada = patch.destacada;
  return fila;
}

export async function listarPublicidades(comunidadId: string): Promise<PublicidadUI[]> {
  if (!supabaseDisponible || !comunidadId) return [];
  const { data, error } = await requireSupabase()
    .from('publicidades')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .order('destacada', { ascending: false })
    .order('creada_en', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(filaAPublicidad);
}

export async function crearPublicidad(
  comunidadId: string,
  pub: Partial<PublicidadUI>
): Promise<PublicidadUI> {
  const fila = { ...publicidadAFila(pub), comunidad_id: comunidadId };
  const { data, error } = await requireSupabase()
    .from('publicidades')
    .insert(fila)
    .select()
    .single();
  if (error) throw error;
  return filaAPublicidad(data);
}

export async function eliminarPublicidad(id: string): Promise<void> {
  const { error } = await requireSupabase().from('publicidades').delete().eq('id', id);
  if (error) throw error;
}
