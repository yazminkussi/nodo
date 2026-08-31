/* Capa de datos de novedades contra Supabase. */

import { supabase, supabaseDisponible } from '../supabaseClient';

export function filaANovedad(f) {
  return {
    id: f.id,
    comunidadId: f.comunidad_id,
    titulo: f.titulo,
    contenido: f.contenido ?? '',
    categoria: f.categoria,
    emoji: f.emoji ?? '📣',
    destacada: f.destacada,
    fecha: f.fecha, // ISO 'YYYY-MM-DD', compatible con el resto de la app
  };
}

function novedadAFila(patch) {
  const fila = {};
  if (patch.titulo !== undefined) fila.titulo = patch.titulo;
  if (patch.contenido !== undefined) fila.contenido = patch.contenido;
  if (patch.categoria !== undefined) fila.categoria = patch.categoria;
  if (patch.emoji !== undefined) fila.emoji = patch.emoji;
  if (patch.destacada !== undefined) fila.destacada = patch.destacada;
  if (patch.fecha !== undefined) fila.fecha = patch.fecha;
  return fila;
}

export async function listarNovedades(comunidadId) {
  if (!supabaseDisponible || !comunidadId) return [];
  const { data, error } = await supabase
    .from('novedades')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .order('fecha', { ascending: false })
    .order('creada_en', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(filaANovedad);
}

export async function crearNovedad(comunidadId, novedad) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fila = { ...novedadAFila(novedad), comunidad_id: comunidadId, autor_id: user?.id ?? null };
  const { data, error } = await supabase.from('novedades').insert(fila).select().single();
  if (error) throw error;
  return filaANovedad(data);
}

export async function actualizarNovedad(id, patch) {
  const { data, error } = await supabase
    .from('novedades')
    .update(novedadAFila(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return filaANovedad(data);
}

export async function eliminarNovedad(id) {
  const { error } = await supabase.from('novedades').delete().eq('id', id);
  if (error) throw error;
}
