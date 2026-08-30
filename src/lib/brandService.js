/* Servicio de marca (logo) con sincronización en la nube.
   - Sube el logo de la comunidad a Supabase Storage (bucket `logos`).
   - Persiste la URL pública del logo + nombre en la tabla `comunidad_config`.
   - Sin Supabase configurado, todo se mantiene en el estado local (demo). */

import { supabase, supabaseDisponible } from './supabaseClient';

export const BUCKET_LOGOS = 'logos';
export const TABLA_CONFIG = 'comunidad_config';

const NOMBRE_ARCHIVO = (comunidadId) => `comunidad-${comunidadId}.png`;

// Almacén de destino: donde el logo pasa de dataUrl a blob para poder subirlo.
export function dataUrlToBlob(dataUrl) {
  const [meta, b64] = String(dataUrl).split(',');
  const mime = /data:([^;]+);/.exec(meta)?.[1] || 'image/png';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Cache-buster para evitar el caché de imagen "vieja" del SW / HTTP.
export function logoConVersion(url) {
  if (!url) return url;
  if (url.startsWith('data:')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${Date.now()}`;
}

export async function cargarComunidadConfig(comunidadId) {
  if (!supabaseDisponible) return null;
  try {
    const { data, error } = await supabase
      .from(TABLA_CONFIG)
      .select('*')
      .eq('comunidad_id', comunidadId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.warn('NODO: no se pudo leer la config de la comunidad.', err.message);
    return null;
  }
}

export async function sincronizarLogo({ comunidadId, dataUrl }) {
  if (!supabaseDisponible) return { ok: true, local: true };
  try {
    const blob = dataUrlToBlob(dataUrl);
    const ruta = NOMBRE_ARCHIVO(comunidadId);

    const { error: upError } = await supabase.storage
      .from(BUCKET_LOGOS)
      .upload(ruta, blob, { upsert: true, contentType: blob.type, cacheControl: '3600' });
    if (upError) throw upError;

    const { data: publica } = supabase.storage.from(BUCKET_LOGOS).getPublicUrl(ruta);

    const etag =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const { data: fila, error: cfgError } = await supabase
      .from(TABLA_CONFIG)
      .upsert({ comunidad_id: comunidadId, logo_url: publica.publicUrl, logo_etag: etag }, { onConflict: 'comunidad_id' })
      .select()
      .single();
    if (cfgError) throw cfgError;

    return { ok: true, logoUrl: publica.publicUrl, config: fila };
  } catch (err) {
    console.warn('NODO: no se pudo sincronizar el logo.', err);
    return { ok: false, error: err };
  }
}

export async function sincronizarNombre({ comunidadId, nombre, logoUrl }) {
  if (!supabaseDisponible) return { ok: true, local: true };
  try {
    const patch = { comunidad_id: comunidadId };
    if (nombre !== undefined) patch.nombre = nombre;
    if (logoUrl !== undefined) patch.logo_url = logoUrl;
    const { error } = await supabase
      .from(TABLA_CONFIG)
      .upsert(patch, { onConflict: 'comunidad_id' });
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.warn('NODO: no se pudo sincronizar el nombre.', err);
    return { ok: false, error: err };
  }
}

export async function limpiarLogo(comunidadId) {
  if (!supabaseDisponible) return { ok: true, local: true };
  try {
    const ruta = NOMBRE_ARCHIVO(comunidadId);
    await supabase.storage.from(BUCKET_LOGOS).remove([ruta]);
    const { error } = await supabase
      .from(TABLA_CONFIG)
      .update({ logo_url: null, logo_etag: null })
      .eq('comunidad_id', comunidadId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.warn('NODO: no se pudo limpiar el logo remoto.', err);
    return { ok: false, error: err };
  }
}
