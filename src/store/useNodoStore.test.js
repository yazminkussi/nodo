import { describe, it, expect, beforeEach } from 'vitest';
import { useNodoStore } from './useNodoStore';
import { sociosIniciales, espaciosIniciales, reservasIniciales, todayISO } from '../data/mockData';

const reset = () =>
  useNodoStore.setState({
    members: sociosIniciales.map((s) => ({ ...s })),
    espacios: espaciosIniciales.map((e) => ({ ...e })),
    reservations: reservasIniciales.map((r) => ({ ...r })),
  });

beforeEach(reset);

describe('cuotas', () => {
  it('registrarPago pone la cuota al día', () => {
    const moroso = useNodoStore.getState().members.find((m) => !m.cuotaAlDia);
    useNodoStore.getState().registrarPago(moroso.id);
    const actualizado = useNodoStore.getState().members.find((m) => m.id === moroso.id);
    expect(actualizado.cuotaAlDia).toBe(true);
    expect(actualizado.ultimaCuota).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('toggleCuotaStatus alterna el estado', () => {
    const s = useNodoStore.getState().members[0];
    const antes = s.cuotaAlDia;
    useNodoStore.getState().toggleCuotaStatus(s.id);
    expect(useNodoStore.getState().members[0].cuotaAlDia).toBe(!antes);
  });
});

describe('reservas', () => {
  it('isSlotTaken detecta un turno ocupado', () => {
    const r = useNodoStore.getState().reservations[0];
    expect(useNodoStore.getState().isSlotTaken(r.espacioId, r.fecha, r.inicio)).toBe(true);
    expect(useNodoStore.getState().isSlotTaken(r.espacioId, r.fecha, '23:30')).toBe(false);
  });

  it('addReservation agrega la reserva y calcula el fin', () => {
    const antes = useNodoStore.getState().reservations.length;
    const reserva = useNodoStore.getState().addReservation({
      espacioId: 1,
      socioId: 2,
      socioNombre: 'Test',
      fecha: todayISO(),
      inicio: '07:00',
      duracion: 2,
    });
    expect(useNodoStore.getState().reservations.length).toBe(antes + 1);
    expect(reserva.fin).toBe('09:00');
    expect(reserva.estado).toBe('confirmada');
  });

  it('cancelReservation la quita', () => {
    const r = useNodoStore.getState().reservations[0];
    useNodoStore.getState().cancelReservation(r.id);
    expect(useNodoStore.getState().reservations.find((x) => x.id === r.id)).toBeUndefined();
  });
});

describe('inscripciones a actividades', () => {
  it('addInscripcion y isInscripto', () => {
    const st = useNodoStore.getState();
    expect(st.isInscripto(999, 999)).toBe(false);
    st.addInscripcion({ actividadId: 999, socioId: 999, socioNombre: 'X' });
    expect(useNodoStore.getState().isInscripto(999, 999)).toBe(true);
  });
});
