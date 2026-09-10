/* Parser de CSV mínimo, sin dependencias.
   Soporta comillas dobles, comas y saltos de línea dentro de campos citados,
   y separador coma o punto y coma (Excel en es-AR suele usar ";"). */

export interface CSVParseado {
  headers: string[];
  filas: string[][];
}

function detectarSeparador(primeraLinea: string): ',' | ';' | '\t' {
  const cont = (ch: string) => (primeraLinea.match(new RegExp(`\\${ch}`, 'g')) || []).length;
  const tabs = (primeraLinea.match(/\t/g) || []).length;
  if (tabs > cont(',') && tabs > cont(';')) return '\t';
  return cont(';') > cont(',') ? ';' : ',';
}

export function parsearCSV(texto: string): CSVParseado {
  const limpio = texto.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const primeraLinea = limpio.slice(
    0,
    limpio.indexOf('\n') === -1 ? undefined : limpio.indexOf('\n')
  );
  const sep = detectarSeparador(primeraLinea);

  const filas: string[][] = [];
  let campo = '';
  let fila: string[] = [];
  let enComillas = false;

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (enComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      enComillas = true;
    } else if (c === sep) {
      fila.push(campo);
      campo = '';
    } else if (c === '\n') {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else {
      campo += c;
    }
  }
  if (campo !== '' || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }

  const noVacias = filas.filter((f) => f.some((v) => v.trim() !== ''));
  if (noVacias.length === 0) return { headers: [], filas: [] };

  const [cabecera, ...resto] = noVacias;
  return {
    headers: cabecera.map((h) => h.trim()),
    filas: resto.map((f) => f.map((v) => v.trim())),
  };
}
