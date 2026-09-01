/* Capa de datos de novedades contra Supabase. */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';
import type { Fila } from './tipos';

export interface NovedadUI {
  id: string;
  comunidadId: string;
  titulo: string;
  contenido: string;
  categoria: string;
  emoji: string;
  destacada: boolean;
  fecha: string;
}

export function filaANovedad(f: Fila): NovedadUI {
  return {
    id: f.id,
    comunidadId: f.comunidad_id,
    titulo: f.titulo,
    contenido: f.contenido ?? '',
    categoria: f.categoria,
    emoji: f.emoji ?? '📣',
    destacada: f.destacada,
    fecha: f.fecha,
  };
}

function novedadAFila(patch: Partial<NovedadUI>): Fila {
  const fila: Fila = {};
  if (patch.titulo !== undefined) fila.titulo = patch.titulo;
  if (patch.contenido !== undefined) fila.contenido = patch.contenido;
  if (patch.categoria !== undefined) fila.categoria = patch.categoria;
  if (patch.emoji !== undefined) fila.emoji = patch.emoji;
  if (patch.destacada !== undefined) fila.destacada = patch.destacada;
  if (patch.fecha !== undefined) fila.fecha = patch.fecha;
  return fila;
}

export async function listarNovedades(comunidadId: string): Promise<NovedadUI[]> {
  if (!supabaseDisponible || !comunidadId) return [];
  const { data, error } = await requireSupabase()
    .from('novedades')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .order('fecha', { ascending: false })
    .order('creada_en', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(filaANovedad);
}

export async function crearNovedad(
  comunidadId: string,
  novedad: Partial<NovedadUI>
): Promise<NovedadUI> {
  const sb = requireSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const fila = { ...novedadAFila(novedad), comunidad_id: comunidadId, autor_id: user?.id ?? null };
  const { data, error } = await sb.from('novedades').insert(fila).select().single();
  if (error) throw error;
  return filaANovedad(data);
}

export async function actualizarNovedad(id: string, patch: Partial<NovedadUI>): Promise<NovedadUI> {
  const { data, error } = await requireSupabase()
    .from('novedades')
    .update(novedadAFila(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return filaANovedad(data);
}

export async function eliminarNovedad(id: string): Promise<void> {
  const { error } = await requireSupabase().from('novedades').delete().eq('id', id);
  if (error) throw error;
}
