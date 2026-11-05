/* Plan del club activo y lo que incluye.
   Con sesión real manda `comunidades.plan_id`; en modo demo se reconoce por el
   nombre del plan de la comunidad demo. La base aplica los topes de verdad
   (triggers); acá se usa para mostrar/bloquear la interfaz y dar buenos mensajes. */

import { useComunidadActiva } from '../store/useSesion';
import { useComunidadActual } from '../store/useNodoStore';
import { planesB2B } from '../data/mockData';
import type { CapacidadesPlan, PlanB2B } from '../data/mockData';

export type FuncionPlan = 'metricas' | 'recordatorios' | 'panelCompleto';
export type RecursoPlan = 'socios' | 'espacios' | 'publicidades';

const LIMITE_POR_RECURSO: Record<RecursoPlan, keyof CapacidadesPlan> = {
  socios: 'limiteSocios',
  espacios: 'limiteEspacios',
  publicidades: 'limitePublicidades',
};

/** Primer plan (de menor a mayor) que incluye la función. */
export function planMinimoPara(funcion: FuncionPlan): PlanB2B {
  return planesB2B.find((p) => p.capacidades[funcion]) ?? planesB2B[planesB2B.length - 1];
}

/** Aviso de que la función es de un plan superior. */
export function mensajeFuncionBloqueada(funcion: FuncionPlan, nombreFuncion: string): string {
  return `${nombreFuncion} está disponible desde el ${planMinimoPara(funcion).nombre}.`;
}

/** Pide a la pantalla de administración que abra "Planes NODO". */
export function irAPlanes(): void {
  window.dispatchEvent(new CustomEvent('nodo:ir-a-planes'));
}

export interface UsePlan {
  planId: string;
  plan: PlanB2B;
  capacidades: CapacidadesPlan;
  puede: (funcion: FuncionPlan) => boolean;
  /** ¿Ya se usó todo el cupo del recurso? (`usados` = cuántos tiene hoy el club) */
  alcanzoTope: (recurso: RecursoPlan, usados: number) => boolean;
  /** Tope del recurso en este plan (null = sin tope). */
  tope: (recurso: RecursoPlan) => number | null;
}

export function usePlan(): UsePlan {
  const real = useComunidadActiva();
  const demo = useComunidadActual();

  const planId = real?.plan_id ?? planesB2B.find((p) => p.nombre === demo.plan)?.id ?? 'gratis';
  const plan = planesB2B.find((p) => p.id === planId) ?? planesB2B[0];
  const capacidades = plan.capacidades;

  const tope = (recurso: RecursoPlan) => capacidades[LIMITE_POR_RECURSO[recurso]] as number | null;

  return {
    planId,
    plan,
    capacidades,
    puede: (funcion) => capacidades[funcion],
    alcanzoTope: (recurso, usados) => {
      const t = tope(recurso);
      return t !== null && usados >= t;
    },
    tope,
  };
}

/** Texto para cuando el cupo del recurso está lleno. */
export function mensajeTopeAlcanzado(recurso: RecursoPlan, plan: PlanB2B): string {
  const tope = plan.capacidades[LIMITE_POR_RECURSO[recurso]] as number | null;
  const nombres: Record<RecursoPlan, [string, string]> = {
    socios: ['socio', 'socios'],
    espacios: ['espacio', 'espacios'],
    publicidades: ['publicidad', 'publicidades'],
  };
  const [sing, plur] = nombres[recurso];
  if (tope === 0) return `El ${plan.nombre} no incluye ${plur}. Mejorá el plan para usarlas.`;
  return `El ${plan.nombre} incluye hasta ${tope} ${tope === 1 ? sing : plur}. Mejorá el plan para sumar más.`;
}
