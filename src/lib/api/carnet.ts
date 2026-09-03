/* Cliente de las Edge Functions del carnet QR.
   - carnet-token: pide un payload firmado por el servidor (el secreto ya no
     está en el bundle).
   - verificar-carnet: valida el escaneo contra la base y registra el ingreso. */

import { requireSupabase } from '../supabaseClient';

export interface TokenCarnet {
  payload: string;
  expiraEnMin: number;
}

export interface SocioAcceso {
  id: string;
  numero: string;
  nombre: string;
  apellido: string;
  cuotaAlDia: boolean;
  plan: number;
  ultimaCuota: string | null;
}

export interface ResultadoAcceso {
  resultado: 'permitido' | 'denegado' | 'invalido';
  motivo: string;
  estadoAlIngreso: string;
  comunidadIncorrecta: boolean;
  timestamp: string;
  socio: SocioAcceso | null;
  reserva: { espacioNombre: string; hora: string } | null;
}

/** Intenta sacar el mensaje de error del cuerpo de la respuesta de la función. */
async function mensajeError(error: unknown, porDefecto: string): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    } catch {
      /* respuesta sin JSON */
    }
  }
  return (error as { message?: string })?.message || porDefecto;
}

export async function pedirTokenCarnet(comunidadId: string): Promise<TokenCarnet> {
  const { data, error } = await requireSupabase().functions.invoke('carnet-token', {
    body: { comunidadId },
  });
  if (error) throw new Error(await mensajeError(error, 'No se pudo generar el carnet.'));
  return data as TokenCarnet;
}

export interface ArgsVerificacion {
  comunidadId: string;
  payload?: string;
  socioId?: string;
  metodo?: 'qr' | 'manual';
  escaneadoPor?: string;
  override?: boolean;
}

export async function verificarCarnetRemoto(args: ArgsVerificacion): Promise<ResultadoAcceso> {
  const { data, error } = await requireSupabase().functions.invoke('verificar-carnet', {
    body: args,
  });
  if (error) throw new Error(await mensajeError(error, 'No se pudo verificar el carnet.'));
  return data as ResultadoAcceso;
}
