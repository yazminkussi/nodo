import { describe, it, expect } from 'vitest';
import {
  normalizarCelular,
  formatearMonto,
} from '../../../supabase/functions/enviar-recordatorio/telefono.ts';

describe('normalizarCelular', () => {
  it.each([
    ['54 9 11 5555-1201', '5491155551201'],
    ['+54 9 11 5555 1201', '5491155551201'],
    ['11 5555-1201', '5491155551201'],
    ['011 5555-1201', '5491155551201'],
    ['(011) 15-5555-1201', '5491155551201'],
    ['54 11 5555-1201', '5491155551201'],
    ['0351 15 555-1234', '5493515551234'],
    ['0054 9 11 5555-1201', '5491155551201'],
  ])('arma el formato de WhatsApp para %s', (entrada, esperado) => {
    expect(normalizarCelular(entrada)).toBe(esperado);
  });

  it.each(['', '   ', 'sin celular', '5555-1201', '15 5555-1201', '123'])(
    'devuelve null cuando no alcanza para armar un número (%s)',
    (entrada) => {
      expect(normalizarCelular(entrada)).toBeNull();
    }
  );

  it('tolera valores vacíos o no string', () => {
    expect(normalizarCelular(null)).toBeNull();
    expect(normalizarCelular(undefined)).toBeNull();
  });
});

describe('formatearMonto', () => {
  it('formatea con separador de miles', () => {
    expect(formatearMonto(18000)).toBe('$ 18.000');
    expect(formatearMonto(0)).toBe('$ 0');
  });
  it('tolera valores raros', () => {
    expect(formatearMonto(undefined)).toBe('$ 0');
  });
});
