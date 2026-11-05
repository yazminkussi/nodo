/* Planes (freemium por cantidad de socios).
   El tope real lo aplica la base (trigger `limitar_socios_por_plan`); acá sólo
   se consulta el uso y se reconoce el error para mostrarlo bien. */

import { supabaseDisponible, requireSupabase } from '../supabaseClient';

export interface UsoPlan {
  planId: string;
  planNombre: string;
  /** null = sin tope */
  limiteSocios: number | null;
  sociosUsados: number;
}

/** Cuántos socios más entran en el plan (null = sin tope). */
export function lugaresLibres(uso: UsoPlan): number | null {
  return uso.limiteSocios === null ? null : Math.max(0, uso.limiteSocios - uso.sociosUsados);
}

/** Plan, tope y socios usados del club. Sólo lo pueden consultar los admins. */
export async function usoPlan(comunidadId: string): Promise<UsoPlan | null> {
  if (!supabaseDisponible) return null;
  const { data, error } = await requireSupabase().rpc('uso_plan', { cid: comunidadId });
  if (error) {
    console.warn('NODO: no se pudo consultar el uso del plan.', error.message);
    return null;
  }
  const fila = Array.isArray(data) ? data[0] : data;
  if (!fila) return null;
  return {
    planId: fila.plan_id,
    planNombre: fila.plan_nombre,
    limiteSocios: fila.limite_socios ?? null,
    sociosUsados: fila.socios_usados ?? 0,
  };
}

/** ¿El error viene del tope de socios del plan? */
export function esErrorLimitePlan(err: unknown): boolean {
  const e = err as { details?: string; message?: string } | null;
  return (
    e?.details === 'limite_plan' || /Alcanzaste el límite de \d+ socios/.test(e?.message ?? '')
  );
}

/** Mensaje para el import en lote cuando no entran todos. */
export function mensajeLoteExcedido(uso: UsoPlan, aImportar: number): string | null {
  const libres = lugaresLibres(uso);
  if (libres === null || aImportar <= libres) return null;
  const entran =
    libres === 0
      ? 'No queda lugar.'
      : `Podés importar ${libres} ${libres === 1 ? 'socio' : 'socios'} más.`;
  return `El ${uso.planNombre} permite hasta ${uso.limiteSocios} socios y ya tenés ${uso.sociosUsados}. ${entran} Mejorá el plan o importá menos filas.`;
}
