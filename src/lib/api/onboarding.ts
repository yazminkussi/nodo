/* Alta de institución. La creación de la comunidad + la membresía de
   superadmin se hace en una RPC (SECURITY DEFINER) para que sea atómica. */

import { requireSupabase } from '../supabaseClient';

export interface DatosComunidad {
  nombre: string;
  tipo?: string;
  ciudad?: string;
  barrio?: string;
  plan?: string;
}

/** Crea el club y deja a la cuenta actual como superadmin. Devuelve el slug. */
export async function crearComunidad(datos: DatosComunidad): Promise<string> {
  const { data, error } = await requireSupabase().rpc('crear_comunidad', {
    p_nombre: datos.nombre,
    p_tipo: datos.tipo ?? null,
    p_ciudad: datos.ciudad ?? null,
    p_barrio: datos.barrio ?? null,
    p_plan: datos.plan ?? null,
  });
  if (error) throw new Error(error.message);
  return data as string;
}
