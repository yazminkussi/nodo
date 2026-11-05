/* Recordatorios de cuota por WhatsApp (Kapso), a través de la Edge Function
   `enviar-recordatorio`. Las reglas (plan, rol, 24 hs, celular válido) las
   aplica el servidor; acá sólo se traduce la respuesta. */

import { requireSupabase } from '../supabaseClient';

export type ResultadoRecordatorio =
  | { enviado: true }
  /** Kapso todavía no está configurado en el servidor: usar el enlace manual. */
  | { enviado: false; motivo: 'sin_config' };

async function leerError(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    } catch {
      /* cuerpo no JSON: se usa el mensaje genérico */
    }
  }
  return 'No se pudo enviar el recordatorio. Probá de nuevo.';
}

/** Manda el recordatorio de cuota al socio. Lanza Error con un mensaje listo para mostrar. */
export async function enviarRecordatorio(socioId: string): Promise<ResultadoRecordatorio> {
  const { data, error } = await requireSupabase().functions.invoke('enviar-recordatorio', {
    body: { socioId },
  });
  if (error) throw new Error(await leerError(error));
  if (data?.enviado === true) return { enviado: true };
  if (data?.motivo === 'sin_config') return { enviado: false, motivo: 'sin_config' };
  throw new Error('Respuesta inesperada del servidor.');
}
