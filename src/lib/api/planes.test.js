import { describe, it, expect } from 'vitest';
import { planesB2B } from '../../data/mockData';
import { esErrorLimitePlan, lugaresLibres, mensajeLoteExcedido } from './planes';

const gratis = (usados) => ({
  planId: 'gratis',
  planNombre: 'Plan Gratis',
  limiteSocios: 60,
  sociosUsados: usados,
});

const ilimitado = {
  planId: 'plan-400',
  planNombre: 'Plan 400+ Socios',
  limiteSocios: null,
  sociosUsados: 900,
};

describe('lugaresLibres', () => {
  it('descuenta los socios usados del tope', () => {
    expect(lugaresLibres(gratis(45))).toBe(15);
  });
  it('no baja de cero si el club ya se pasó', () => {
    expect(lugaresLibres(gratis(75))).toBe(0);
  });
  it('devuelve null cuando el plan no tiene tope', () => {
    expect(lugaresLibres(ilimitado)).toBeNull();
  });
});

describe('mensajeLoteExcedido', () => {
  it('deja importar si entran todas las filas', () => {
    expect(mensajeLoteExcedido(gratis(50), 10)).toBeNull();
  });
  it('avisa cuántos socios entran todavía', () => {
    const msg = mensajeLoteExcedido(gratis(50), 11);
    expect(msg).toContain('Plan Gratis');
    expect(msg).toContain('hasta 60 socios');
    expect(msg).toContain('Podés importar 10 socios más');
  });
  it('usa singular cuando queda un solo lugar', () => {
    expect(mensajeLoteExcedido(gratis(59), 5)).toContain('Podés importar 1 socio más');
  });
  it('avisa que no queda lugar cuando el plan está lleno', () => {
    expect(mensajeLoteExcedido(gratis(60), 1)).toContain('No queda lugar');
  });
  it('nunca bloquea en planes sin tope', () => {
    expect(mensajeLoteExcedido(ilimitado, 5000)).toBeNull();
  });
});

describe('esErrorLimitePlan', () => {
  it('reconoce el detalle que manda el trigger', () => {
    expect(esErrorLimitePlan({ details: 'limite_plan', message: 'x' })).toBe(true);
  });
  it('reconoce el mensaje aunque no llegue el detalle', () => {
    expect(
      esErrorLimitePlan({
        message:
          'Alcanzaste el límite de 60 socios del Plan Gratis. Mejorá el plan para sumar más.',
      })
    ).toBe(true);
  });
  it('ignora otros errores', () => {
    expect(esErrorLimitePlan({ message: 'duplicate key value' })).toBe(false);
    expect(esErrorLimitePlan(null)).toBe(false);
  });
});

describe('matriz de planes', () => {
  const orden = ['gratis', 'plan-100', 'plan-250', 'plan-400'];
  const tope = (v) => (v === null ? Infinity : v);

  it('mantiene el orden gratis < 100 < 250 < 400+', () => {
    expect(planesB2B.map((p) => p.id)).toEqual(orden);
  });

  it('el Plan Gratis es gratis y llega a 60 socios', () => {
    expect(planesB2B[0].precioMensual).toBe(0);
    expect(planesB2B[0].capacidades.limiteSocios).toBe(60);
  });

  it('cada plan incluye al menos lo del anterior', () => {
    for (let i = 1; i < planesB2B.length; i++) {
      const a = planesB2B[i - 1];
      const b = planesB2B[i];
      expect(b.precioMensual).toBeGreaterThan(a.precioMensual);
      for (const k of ['limiteSocios', 'limiteEspacios', 'limitePublicidades']) {
        expect(tope(b.capacidades[k])).toBeGreaterThanOrEqual(tope(a.capacidades[k]));
      }
      for (const k of ['metricas', 'recordatorios', 'panelCompleto']) {
        if (a.capacidades[k]) expect(b.capacidades[k]).toBe(true);
      }
    }
  });
});
