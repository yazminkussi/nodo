/* Tipos compartidos de la capa de datos.
   Los modelos de UI reutilizan los tipos del dominio (mockData); las filas de
   la base (snake_case) se describen acá de forma laxa porque PostgREST las
   devuelve como `any`. */

export type {
  Socio,
  Espacio,
  Reserva,
  Novedad,
  Comunidad,
  HorarioConfig,
  CategoriaEspacio,
} from '../../data/mockData';

/** Fila cruda de la base (cualquier tabla). */
export type Fila = Record<string, any>;

export type RolMembresia = 'socio' | 'superadmin' | 'deportes' | 'talleres';

export interface Perfil {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  avatar_url: string | null;
}

export interface ComunidadRemota {
  id: string;
  nombre: string;
  institucion?: string | null;
  tipo?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  barrio?: string | null;
  plan?: string | null;
  logo_url?: string | null;
}

export interface Membresia {
  id: string;
  rol: RolMembresia;
  categorias: string[];
  estado: string;
  comunidad: ComunidadRemota | null;
}

export interface MiembroEquipo {
  membresiaId: string;
  perfilId: string;
  rol: RolMembresia;
  categorias: string[];
  nombre: string;
  apellido: string;
  email: string;
}
