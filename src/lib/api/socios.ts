/* Capa de datos de socios contra Supabase.
   Convierte entre la fila de la base (snake_case) y la forma que usa la UI. */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';
import type { Fila, Socio } from './tipos';

/** Ficha de socio como la usa la UI (compatible con el shape del mock). */
export interface SocioUI extends Omit<Socio, 'id'> {
  id: string;
  perfilId: string | null;
  comunidadId: string;
}

/* fila DB -> objeto UI */
export function filaASocio(f: Fila): SocioUI {
  return {
    id: f.id,
    perfilId: f.perfil_id ?? null,
    comunidadId: f.comunidad_id,
    numero: f.numero,
    nombre: f.nombre,
    apellido: f.apellido,
    dni: f.dni ?? '',
    email: f.email ?? '',
    celular: f.celular ?? '',
    categoria: f.categoria,
    cuotaAlDia: f.cuota_al_dia,
    ultimaCuota: f.ultima_cuota ? formatearFecha(f.ultima_cuota) : '',
    plan: f.cuota_monto ?? 0,
    localidad: f.localidad ?? '',
    color: f.color ?? '#5E52C4',
  };
}

/* objeto UI (parcial) -> patch DB */
function socioAFila(patch: Partial<SocioUI>): Fila {
  const fila: Fila = {};
  if (patch.numero !== undefined) fila.numero = patch.numero;
  if (patch.nombre !== undefined) fila.nombre = patch.nombre;
  if (patch.apellido !== undefined) fila.apellido = patch.apellido;
  if (patch.dni !== undefined) fila.dni = patch.dni;
  if (patch.email !== undefined) fila.email = patch.email;
  if (patch.celular !== undefined) fila.celular = patch.celular;
  if (patch.categoria !== undefined) fila.categoria = patch.categoria;
  if (patch.cuotaAlDia !== undefined) fila.cuota_al_dia = patch.cuotaAlDia;
  if (patch.plan !== undefined) fila.cuota_monto = patch.plan;
  if (patch.localidad !== undefined) fila.localidad = patch.localidad;
  if (patch.color !== undefined) fila.color = patch.color;
  return fila;
}

function formatearFecha(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Vincula (si corresponde) la ficha de socio con la cuenta actual por email. */
export async function reclamarSocio(): Promise<void> {
  if (!supabaseDisponible) return;
  const { error } = await requireSupabase().rpc('reclamar_socio');
  if (error) console.warn('NODO: no se pudo reclamar la ficha de socio.', error.message);
}

/** Ficha de socio de la cuenta actual en una comunidad (o null). */
export async function miSocioDe(comunidadId: string | null): Promise<SocioUI | null> {
  if (!supabaseDisponible || !comunidadId) return null;
  const sb = requireSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb
    .from('socios')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .eq('perfil_id', user.id)
    .maybeSingle();
  if (error) {
    console.warn('NODO: no se pudo cargar la ficha de socio propia.', error.message);
    return null;
  }
  return data ? filaASocio(data) : null;
}

export async function listarSocios(comunidadId: string): Promise<SocioUI[]> {
  if (!supabaseDisponible) return [];
  const { data, error } = await requireSupabase()
    .from('socios')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .order('numero', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(filaASocio);
}

export async function crearSocio(comunidadId: string, socio: Partial<SocioUI>): Promise<SocioUI> {
  const fila = { ...socioAFila(socio), comunidad_id: comunidadId };
  const { data, error } = await requireSupabase().from('socios').insert(fila).select().single();
  if (error) throw error;
  return filaASocio(data);
}

export async function actualizarSocio(id: string, patch: Partial<SocioUI>): Promise<SocioUI> {
  const { data, error } = await requireSupabase()
    .from('socios')
    .update(socioAFila(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return filaASocio(data);
}

export async function eliminarSocio(id: string): Promise<void> {
  const { error } = await requireSupabase().from('socios').delete().eq('id', id);
  if (error) throw error;
}

/** Marca la cuota al día y actualiza la fecha de última cuota a hoy. */
export async function registrarPagoSocio(id: string): Promise<SocioUI> {
  const hoy = new Date().toISOString().slice(0, 10);
  const { data, error } = await requireSupabase()
    .from('socios')
    .update({ cuota_al_dia: true, ultima_cuota: hoy })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return filaASocio(data);
}

export async function cambiarEstadoCuota(id: string, alDia: boolean): Promise<SocioUI> {
  const patch: Fila = { cuota_al_dia: alDia };
  if (alDia) patch.ultima_cuota = new Date().toISOString().slice(0, 10);
  const { data, error } = await requireSupabase()
    .from('socios')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return filaASocio(data);
}
