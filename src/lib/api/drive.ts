/* Capa de datos del Drive interno contra Supabase.
   - tipo 'doc'     -> contenido jsonb { html }
   - tipo 'sheet'   -> contenido jsonb { columnas, filas }
   - tipo 'archivo' -> archivo en el bucket privado 'drive' (storage_path) */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';
import type { Fila } from './tipos';

export type TipoDrive = 'archivo' | 'sheet' | 'doc';

export interface HojaContenido {
  columnas: string[];
  filas: (string | number)[][];
}

export interface DriveItemUI {
  id: string;
  comunidadId: string;
  carpetaId: string;
  tipo: TipoDrive;
  nombre: string;
  autor: string;
  fecha: string;
  mime?: string;
  tamano?: number;
  storagePath?: string;
  contenido?: HojaContenido | string;
}

export function filaADriveItem(f: Fila): DriveItemUI {
  let contenido: HojaContenido | string | undefined;
  if (f.tipo === 'doc') contenido = (f.contenido?.html ?? '') as string;
  else if (f.tipo === 'sheet')
    contenido = (f.contenido ?? { columnas: [], filas: [] }) as HojaContenido;

  return {
    id: f.id,
    comunidadId: f.comunidad_id,
    carpetaId: f.carpeta_id,
    tipo: f.tipo,
    nombre: f.nombre,
    autor: f.autor ?? '',
    fecha: String(f.creada_en ?? '').slice(0, 10),
    mime: f.mime ?? undefined,
    tamano: f.tamano ?? undefined,
    storagePath: f.storage_path ?? undefined,
    contenido,
  };
}

function contenidoAFila(tipo: TipoDrive, contenido: HojaContenido | string | undefined): unknown {
  if (tipo === 'doc') return { html: typeof contenido === 'string' ? contenido : '' };
  if (tipo === 'sheet')
    return contenido ?? { columnas: ['N°', 'Nombre', 'Detalle'], filas: [['', '', '']] };
  return null;
}

export async function listarDriveItems(comunidadId: string): Promise<DriveItemUI[]> {
  if (!supabaseDisponible || !comunidadId) return [];
  const { data, error } = await requireSupabase()
    .from('drive_items')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .order('creada_en', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(filaADriveItem);
}

interface NuevoDoc {
  carpetaId: string;
  nombre: string;
  autor: string;
  tipo: 'doc' | 'sheet';
}

export async function crearDocDrive(comunidadId: string, d: NuevoDoc): Promise<DriveItemUI> {
  const { data, error } = await requireSupabase()
    .from('drive_items')
    .insert({
      comunidad_id: comunidadId,
      carpeta_id: d.carpetaId,
      tipo: d.tipo,
      nombre: d.nombre,
      autor: d.autor,
      contenido: contenidoAFila(d.tipo, undefined),
    })
    .select()
    .single();
  if (error) throw error;
  return filaADriveItem(data);
}

export async function subirArchivoDrive(
  comunidadId: string,
  args: { carpetaId: string; file: File; autor: string }
): Promise<DriveItemUI> {
  const sb = requireSupabase();
  const limpio = args.file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${comunidadId}/${crypto.randomUUID()}-${limpio}`;

  const up = await sb.storage.from('drive').upload(path, args.file, {
    contentType: args.file.type || 'application/octet-stream',
    upsert: false,
  });
  if (up.error) throw up.error;

  const { data, error } = await sb
    .from('drive_items')
    .insert({
      comunidad_id: comunidadId,
      carpeta_id: args.carpetaId,
      tipo: 'archivo',
      nombre: args.file.name,
      autor: args.autor,
      mime: args.file.type || 'application/octet-stream',
      tamano: args.file.size,
      storage_path: path,
    })
    .select()
    .single();
  if (error) {
    await sb.storage.from('drive').remove([path]);
    throw error;
  }
  return filaADriveItem(data);
}

export async function actualizarDriveItem(
  id: string,
  tipo: TipoDrive,
  patch: { nombre?: string; contenido?: HojaContenido | string }
): Promise<void> {
  const fila: Fila = {};
  if (patch.nombre !== undefined) fila.nombre = patch.nombre;
  if (patch.contenido !== undefined) fila.contenido = contenidoAFila(tipo, patch.contenido);
  const { error } = await requireSupabase().from('drive_items').update(fila).eq('id', id);
  if (error) throw error;
}

export async function eliminarDriveItem(item: DriveItemUI): Promise<void> {
  const sb = requireSupabase();
  if (item.storagePath) {
    await sb.storage.from('drive').remove([item.storagePath]);
  }
  const { error } = await sb.from('drive_items').delete().eq('id', item.id);
  if (error) throw error;
}

/** URL temporal para descargar un archivo del Drive (60 s). */
export async function urlDescargaDrive(storagePath: string): Promise<string | null> {
  const { data, error } = await requireSupabase()
    .storage.from('drive')
    .createSignedUrl(storagePath, 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}
