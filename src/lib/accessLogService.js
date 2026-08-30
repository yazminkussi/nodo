/* Servicio de registros de acceso.
   Registra cada escaneo en la tabla `registros_acceso` de Supabase cuando la
   integración está configurada. Sin Supabase, todo se guarda en el estado local
   (useNodoStore.registrosAcceso) manteniendo el flujo de la demo. */

import { supabase, supabaseDisponible } from './supabaseClient';

export const TABLA_REGISTROS = 'registros_acceso';

const camposPermitidos = [
  'usuario_id',
  'numero_socio',
  'nombre',
  'comunidad_id',
  'comunidad_nombre',
  'timestamp',
  'estado_al_ingreso',
  'resultado',
  'motivo',
  'escaneado_por',
  'metodo',
  'detalle_reserva',
];

export async function guardarRegistroAcceso(datos) {
  if (supabaseDisponible) {
    const fila = {};
    camposPermitidos.forEach((c) => {
      if (datos[c] !== undefined) fila[c] = datos[c];
    });
    try {
      const { error } = await supabase.from(TABLA_REGISTROS).insert([fila]);
      if (error) {
        console.warn('NODO: no se pudo registrar en Supabase.', error.message);
        return { ok: false, error };
      }
      return { ok: true };
    } catch (err) {
      console.warn('NODO: error de red en Supabase.', err);
      return { ok: false, error: err };
    }
  }
  return { ok: true, local: true };
}

export async function obtenerRegistrosAcceso(limite = 100) {
  if (!supabaseDisponible) return null;
  try {
    const { data, error } = await supabase
      .from(TABLA_REGISTROS)
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limite);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('NODO: no se pudo leer el historial desde Supabase.', err);
    return [];
  }
}

export { supabaseDisponible };