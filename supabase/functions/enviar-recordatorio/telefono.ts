/* Normaliza un celular argentino al formato que pide la API de WhatsApp:
   sólo dígitos, "549" + código de área + número (sin 0 ni 15).

   Acepta, por ejemplo:
     "54 9 11 5555-1201"  "+54 9 11 5555 1201"  "11 5555-1201"
     "011 15 5555-1201"   "15 5555-1201" (sin área: no se puede -> null)
   Devuelve null si no se puede armar un número argentino válido. */
export function normalizarCelular(entrada: string): string | null {
  let d = String(entrada ?? '').replace(/\D/g, '');
  if (!d) return null;

  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1); // ya traía el 9 de celular
  }
  if (d.startsWith('0')) d = d.slice(1); // prefijo interurbano (011, 0351, …)

  // "15" de celular entre el área (2 a 4 dígitos) y el número: se saca.
  if (d.length === 12) {
    for (const i of [2, 3, 4]) {
      if (d.slice(i, i + 2) === '15') {
        d = d.slice(0, i) + d.slice(i + 2);
        break;
      }
    }
  }

  // Número nacional: área + abonado = 10 dígitos.
  // Ningún código de área argentino empieza con 15: es el 15 de celular sin área.
  if (!/^\d{10}$/.test(d) || d.startsWith('15')) return null;
  return `549${d}`;
}

/** "$ 18.000" a partir de un monto entero en pesos. */
export function formatearMonto(monto: number): string {
  return `$ ${Math.round(Number(monto) || 0).toLocaleString('es-AR')}`;
}
