import { describe, it, expect } from 'vitest';
import {
  horaAmin,
  minAstring,
  slotsDeHorario,
  diaActivo,
  mesesAdeudados,
  formatARS,
  nombreDias,
  duracionLabel,
  toISODate,
  addDays,
} from './mockData';

describe('utilidades de hora', () => {
  it('horaAmin convierte HH:MM a minutos', () => {
    expect(horaAmin('00:00')).toBe(0);
    expect(horaAmin('09:30')).toBe(570);
    expect(horaAmin('23:00')).toBe(1380);
  });

  it('minAstring es la inversa de horaAmin', () => {
    for (const t of ['07:00', '09:30', '13:45', '22:00']) {
      expect(minAstring(horaAmin(t))).toBe(t);
    }
  });

  it('slotsDeHorario respeta apertura, cierre y duración', () => {
    const h = { apertura: '09:00', cierre: '12:00', duracionTurno: 1, dias: [1] };
    expect(slotsDeHorario(h)).toEqual(['09:00', '10:00', '11:00']);
  });

  it('slotsDeHorario con turnos de 3 h', () => {
    const h = { apertura: '09:00', cierre: '21:00', duracionTurno: 3, dias: [1] };
    expect(slotsDeHorario(h)).toEqual(['09:00', '12:00', '15:00', '18:00']);
  });
});

describe('diaActivo', () => {
  it('detecta si una fecha cae en un día habilitado', () => {
    // 2026-09-07 es lunes (getDay() === 1)
    expect(diaActivo([1, 2, 3, 4, 5], '2026-09-07')).toBe(true);
    // 2026-09-06 es domingo (getDay() === 0)
    expect(diaActivo([1, 2, 3, 4, 5], '2026-09-06')).toBe(false);
    expect(diaActivo([0, 6], '2026-09-06')).toBe(true);
  });
});

describe('mesesAdeudados', () => {
  it('devuelve 0 si la cuota está al día', () => {
    expect(mesesAdeudados({ cuotaAlDia: true, ultimaCuota: '01/01/2020' })).toBe(0);
  });

  it('cuenta los meses desde la última cuota (mínimo 1)', () => {
    const hoy = new Date();
    const hace3 = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 15);
    const dd = String(hace3.getDate()).padStart(2, '0');
    const mm = String(hace3.getMonth() + 1).padStart(2, '0');
    const ultimaCuota = `${dd}/${mm}/${hace3.getFullYear()}`;
    expect(mesesAdeudados({ cuotaAlDia: false, ultimaCuota })).toBe(3);
  });

  it('nunca devuelve menos de 1 si adeuda', () => {
    const hoy = new Date();
    const ultimaCuota = `01/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
    expect(mesesAdeudados({ cuotaAlDia: false, ultimaCuota })).toBeGreaterThanOrEqual(1);
  });
});

describe('formato', () => {
  it('formatARS muestra pesos sin decimales', () => {
    const s = formatARS(18000);
    expect(s).toContain('18.000');
    expect(s).not.toContain(',00');
  });

  it('nombreDias arma la etiqueta', () => {
    expect(nombreDias([1, 2, 3, 4, 5, 6, 0])).toBe('Todos los días');
    expect(nombreDias([])).toBe('Sin días');
    expect(nombreDias([1, 3])).toBe('Lun · Mié');
  });

  it('duracionLabel', () => {
    expect(duracionLabel(1)).toBe('1 h');
    expect(duracionLabel(1.5)).toBe('1 h 30 min');
    expect(duracionLabel(0.5)).toBe('30 min');
    expect(duracionLabel(3)).toBe('3 h');
  });
});

describe('fechas', () => {
  it('toISODate y addDays', () => {
    const base = new Date(2026, 8, 1); // 1 sep 2026
    expect(toISODate(base)).toBe('2026-09-01');
    expect(toISODate(addDays(base, 5))).toBe('2026-09-06');
    expect(toISODate(addDays(base, -1))).toBe('2026-08-31');
  });
});
