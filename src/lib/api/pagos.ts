/* Capa de datos del historial de pagos de cuota. */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';
import type { Fila } from './tipos';

export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mercadopago' | 'otro';

export interface PagoUI {
  id: string;
  socioId: string;
  monto: number;
  fecha: string;
  metodo: string;
  periodo: string | null;
  concepto: string;
}

export function filaAPago(f: Fila): PagoUI {
  return {
    id: f.id,
    socioId: f.socio_id,
    monto: f.monto ?? 0,
    fecha: String(f.fecha ?? '').slice(0, 10),
    metodo: f.metodo ?? 'efectivo',
    periodo: f.periodo ?? null,
    concepto: f.concepto ?? 'Cuota social',
  };
}

export async function listarPagosDeSocio(comunidadId: string, socioId: string): Promise<PagoUI[]> {
  if (!supabaseDisponible || !comunidadId || !socioId) return [];
  const { data, error } = await requireSupabase()
    .from('pagos')
    .select('*')
    .eq('comunidad_id', comunidadId)
    .eq('socio_id', socioId)
    .order('fecha', { ascending: false })
    .order('creado_en', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(filaAPago);
}

export interface DetallePago {
  monto?: number;
  metodo?: MetodoPago | string;
  periodo?: string | null;
  concepto?: string;
}

/** Registra un pago y deja la cuota al día (RPC atómica). */
export async function registrarPago(socioId: string, detalle: DetallePago = {}): Promise<void> {
  const { error } = await requireSupabase().rpc('registrar_pago_socio', {
    p_socio_id: socioId,
    p_monto: detalle.monto ?? null,
    p_metodo: detalle.metodo ?? 'efectivo',
    p_periodo: detalle.periodo ?? null,
    p_concepto: detalle.concepto ?? 'Cuota social',
  });
  if (error) throw new Error(error.message);
}
