import { describe, it, expect } from 'vitest';
import { filaASocio } from './socios';
import { filaAReserva } from './reservas';
import { filaANovedad } from './novedades';
import { filaAEspacio } from './espacios';

describe('filaASocio', () => {
  it('mapea snake_case de la base a la forma de la UI', () => {
    const fila = {
      id: 'uuid-1',
      perfil_id: 'uuid-p',
      comunidad_id: 'la-union',
      numero: '0142',
      nombre: 'Julieta',
      apellido: 'Méndez',
      dni: '33987654',
      email: 'j@x.com',
      celular: '11 5555',
      categoria: 'Activo',
      cuota_al_dia: true,
      ultima_cuota: '2026-07-15',
      cuota_monto: 18000,
      localidad: 'Caballito',
      color: '#5E52C4',
    };
    const s = filaASocio(fila);
    expect(s).toMatchObject({
      id: 'uuid-1',
      perfilId: 'uuid-p',
      comunidadId: 'la-union',
      numero: '0142',
      nombre: 'Julieta',
      cuotaAlDia: true,
      plan: 18000,
      localidad: 'Caballito',
    });
    expect(s.ultimaCuota).toBe('15/07/2026');
  });

  it('tolera campos nulos', () => {
    const s = filaASocio({ id: '1', comunidad_id: 'c', numero: '1', nombre: 'A', apellido: 'B' });
    expect(s.ultimaCuota).toBe('');
    expect(s.perfilId).toBeNull();
    expect(s.plan).toBe(0);
  });
});

describe('filaAReserva', () => {
  it('mapea la fila y conserva el estado', () => {
    const r = filaAReserva({
      id: 'r1',
      comunidad_id: 'la-union',
      espacio_id: 'e1',
      socio_id: 's1',
      socio_nombre: 'Julieta Méndez',
      fecha: '2026-09-10',
      inicio: '18:00',
      fin: '19:00',
      estado: 'confirmada',
      concepto: null,
    });
    expect(r).toMatchObject({
      id: 'r1',
      espacioId: 'e1',
      socioId: 's1',
      fecha: '2026-09-10',
      inicio: '18:00',
      fin: '19:00',
      estado: 'confirmada',
    });
    expect(r.concepto).toBeUndefined();
  });
});

describe('filaANovedad', () => {
  it('mapea y aplica defaults', () => {
    const n = filaANovedad({
      id: 'n1',
      comunidad_id: 'c',
      titulo: 'Asamblea',
      categoria: 'Institucional',
      destacada: true,
      fecha: '2026-09-01',
    });
    expect(n).toMatchObject({ id: 'n1', titulo: 'Asamblea', destacada: true, emoji: '📣' });
    expect(n.contenido).toBe('');
  });
});

describe('filaAEspacio', () => {
  it('mezcla el horario con el default', () => {
    const e = filaAEspacio({
      id: 'e1',
      comunidad_id: 'c',
      nombre: 'Cancha',
      precio_hora: 18000,
      categoria: 'Deportivo',
      horario: { apertura: '08:00' },
    });
    expect(e.precioHora).toBe(18000);
    expect(e.horario.apertura).toBe('08:00');
    expect(e.horario.cierre).toBeDefined();
    expect(Array.isArray(e.horario.dias)).toBe(true);
  });
});
