import { describe, it, expect } from 'vitest';
import { parsearCSV } from './csv';

describe('parsearCSV', () => {
  it('lee encabezado y filas con separador coma', () => {
    const { headers, filas } = parsearCSV(
      'numero,nombre,apellido\n0142,Julieta,Méndez\n0143,Bruno,Paz'
    );
    expect(headers).toEqual(['numero', 'nombre', 'apellido']);
    expect(filas).toEqual([
      ['0142', 'Julieta', 'Méndez'],
      ['0143', 'Bruno', 'Paz'],
    ]);
  });

  it('detecta el punto y coma (Excel es-AR)', () => {
    const { headers, filas } = parsearCSV('numero;nombre\n1;Ana');
    expect(headers).toEqual(['numero', 'nombre']);
    expect(filas).toEqual([['1', 'Ana']]);
  });

  it('respeta comas y saltos dentro de comillas', () => {
    const { filas } = parsearCSV('a,b\n"uno, dos","línea 1\nlínea 2"');
    expect(filas[0]).toEqual(['uno, dos', 'línea 1\nlínea 2']);
  });

  it('maneja comillas dobles escapadas', () => {
    const { filas } = parsearCSV('a\n"dijo ""hola"""');
    expect(filas[0]).toEqual(['dijo "hola"']);
  });

  it('ignora filas totalmente vacías y el BOM', () => {
    const { headers, filas } = parsearCSV('﻿numero,nombre\n\n1,Ana\n\n');
    expect(headers).toEqual(['numero', 'nombre']);
    expect(filas).toEqual([['1', 'Ana']]);
  });

  it('devuelve vacío si no hay contenido', () => {
    expect(parsearCSV('   ')).toEqual({ headers: [], filas: [] });
  });
});
