/* ============================================================================
   NODO · Datos de demostración
   Club Social y Deportivo ficticio con datos realistas del ámbito argentino.
   Autor: Yazmín Laila Kussi — Entrega Nro 1
   ========================================================================== */

export type Socio = {
  id: number;
  numero: string;
  nombre: string;
  apellido: string;
  email: string;
  celular: string;
  categoria: 'Activo' | 'Adherente' | 'Juvenil' | 'Honorario';
  cuotaAlDia: boolean;
  ultimaCuota: string;
  plan: number;
  color: string;
  localidad: string;
};

export type Espacio = {
  id: number;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioHora: number;
  icono: 'futbol' | 'ceramica' | 'gimnasio' | 'sum' | 'ensayo';
  color: string;
  categoria: 'Deportivo' | 'Cultural' | 'Recreativo';
};

export type Reserva = {
  id: number;
  espacioId: number;
  socioId: number;
  socioNombre: string;
  fecha: string;
  inicio: string;
  fin: string;
  estado: 'confirmada' | 'pendiente';
  concepto?: string;
};

export type Novedad = {
  id: number;
  titulo: string;
  fecha: string;
  categoria: 'Institucional' | 'Evento' | 'Comunicado' | 'Comunidad';
  contenido: string;
  destacada: boolean;
  emoji: string;
};

export type Publicidad = {
  id: number;
  negocio: string;
  rubro: string;
  descuento: string;
  descripcion: string;
  color: string;
  barrio: string;
  destacada: boolean;
};

export type PlanB2B = {
  id: string;
  nombre: string;
  socios: string;
  precioMensual: number;
  destacado: boolean;
  features: string[];
};

/* ---------------------------------- utilidades de fecha ---------------------------------- */

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export const nextDays = (n: number): string[] =>
  Array.from({ length: n }, (_, i) => toISODate(addDays(new Date(), i)));

export const HORARIOS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

export const nextHour = (): string => {
  const h = new Date().getHours() + 1;
  return `${String(Math.max(9, Math.min(20, h))).padStart(2, '0')}:00`;
};

export const formatARS = (n: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

export const formatFechaLarga = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
};

export const formatFechaCorta = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

/* ---------------------------------- club ---------------------------------- */

export const clubInfo = {
  nombre: 'Club Social y Deportivo La Unión',
  institucion: 'Centro Cultural y Deportivo',
  direccion: 'Av. Rivadavia 3456, Villa Crespo',
  ciudad: 'Ciudad de Buenos Aires',
  cuit: '30-70998877-4',
  telefono: '11 4824-3000',
  plan: 'Plan 250 Socios',
  cuentaBanco: 'Cuenta corriente N° 3445-9 / Banco Nación',
  email: 'contacto@clubunion.com.ar',
};

/* ---------------------------------- socios ---------------------------------- */

export const sociosIniciales: Socio[] = [
  {
    id: 1,
    numero: '0001',
    nombre: 'Carlos',
    apellido: 'Kussi',
    email: 'carlos.kussi@clubunion.com.ar',
    celular: '54 9 11 5555-1201',
    categoria: 'Honorario',
    cuotaAlDia: true,
    ultimaCuota: '01/07/2026',
    plan: 18000,
    color: '#0F172A',
    localidad: 'Villa Crespo',
  },
  {
    id: 2,
    numero: '0142',
    nombre: 'Julieta',
    apellido: 'Méndez',
    email: 'julieta.mendez@gmail.com',
    celular: '54 9 11 5555-9802',
    categoria: 'Activo',
    cuotaAlDia: true,
    ultimaCuota: '15/07/2026',
    plan: 18000,
    color: '#0D9488',
    localidad: 'Caballito',
  },
  {
    id: 3,
    numero: '0087',
    nombre: 'Roberto',
    apellido: 'Fernández',
    email: 'roberto.fernandez@gmail.com',
    celular: '54 9 11 5555-3340',
    categoria: 'Honorario',
    cuotaAlDia: true,
    ultimaCuota: '05/07/2026',
    plan: 15000,
    color: '#334155',
    localidad: 'Almagro',
  },
  {
    id: 4,
    numero: '0231',
    nombre: 'Mariana',
    apellido: 'López',
    email: 'mariana.lopez@hotmail.com',
    celular: '54 9 11 5555-7715',
    categoria: 'Activo',
    cuotaAlDia: true,
    ultimaCuota: '12/07/2026',
    plan: 18000,
    color: '#059669',
    localidad: 'Villa Crespo',
  },
  {
    id: 5,
    numero: '0198',
    nombre: 'Diego',
    apellido: 'Correa',
    email: 'diego.correa@gmail.com',
    celular: '54 9 11 5555-4488',
    categoria: 'Activo',
    cuotaAlDia: false,
    ultimaCuota: '12/04/2026',
    plan: 18000,
    color: '#F59E0B',
    localidad: 'Flores',
  },
  {
    id: 6,
    numero: '0315',
    nombre: 'Sofía',
    apellido: 'Almeida',
    email: 'sofi.almeida@icloud.com',
    celular: '54 9 11 5555-6203',
    categoria: 'Juvenil',
    cuotaAlDia: true,
    ultimaCuota: '18/07/2026',
    plan: 12000,
    color: '#06B6D4',
    localidad: 'Boedo',
  },
  {
    id: 7,
    numero: '0110',
    nombre: 'Jorge',
    apellido: 'Paredes',
    email: 'jorge.paredes@yahoo.com.ar',
    celular: '54 9 11 5555-8890',
    categoria: 'Activo',
    cuotaAlDia: false,
    ultimaCuota: '20/03/2026',
    plan: 18000,
    color: '#EF4444',
    localidad: 'Caballito',
  },
  {
    id: 8,
    numero: '0276',
    nombre: 'Lucía',
    apellido: 'Benítez',
    email: 'lucia.benitez@gmail.com',
    celular: '54 9 11 5555-2019',
    categoria: 'Activo',
    cuotaAlDia: true,
    ultimaCuota: '10/07/2026',
    plan: 18000,
    color: '#7C3AED',
    localidad: 'Palermo',
  },
  {
    id: 9,
    numero: '0044',
    nombre: 'Martín',
    apellido: 'Ocampo',
    email: 'martin.ocampo@gmail.com',
    celular: '54 9 11 5555-7764',
    categoria: 'Adherente',
    cuotaAlDia: false,
    ultimaCuota: '02/05/2026',
    plan: 14000,
    color: '#F97316',
    localidad: 'Villa Crespo',
  },
  {
    id: 10,
    numero: '0342',
    nombre: 'Carla',
    apellido: 'Ruiz',
    email: 'carla.ruiz@gmail.com',
    celular: '54 9 11 5555-1102',
    categoria: 'Juvenil',
    cuotaAlDia: true,
    ultimaCuota: '21/07/2026',
    plan: 12000,
    color: '#EC4899',
    localidad: 'Chacarita',
  },
  {
    id: 11,
    numero: '0009',
    nombre: 'Antonio',
    apellido: 'Sosa',
    email: 'antonio.sosa@gmail.com',
    celular: '54 9 11 5555-0954',
    categoria: 'Honorario',
    cuotaAlDia: true,
    ultimaCuota: '01/07/2026',
    plan: 0,
    color: '#64748B',
    localidad: 'Villa Crespo',
  },
  {
    id: 12,
    numero: '0258',
    nombre: 'Nadia',
    apellido: 'Quiroga',
    email: 'nadia.quiroga@gmail.com',
    celular: '54 9 11 5555-3155',
    categoria: 'Activo',
    cuotaAlDia: false,
    ultimaCuota: '30/05/2026',
    plan: 18000,
    color: '#0EA5E9',
    localidad: 'Villa Luro',
  },
];

/* ---------------------------------- espacios ---------------------------------- */

export const espaciosIniciales: Espacio[] = [
  {
    id: 1,
    nombre: 'Cancha de Fútbol 5',
    descripcion: 'Césped sintético y luces LED para partidos nocturnos.',
    capacidad: 22,
    precioHora: 18000,
    icono: 'futbol',
    color: '#059669',
    categoria: 'Deportivo',
  },
  {
    id: 2,
    nombre: 'Taller de Cerámica',
    descripcion: 'Sala equipada con tornos, horno y mesas de trabajo.',
    capacidad: 16,
    precioHora: 6500,
    icono: 'ceramica',
    color: '#0D9488',
    categoria: 'Cultural',
  },
  {
    id: 3,
    nombre: 'Gimnasio',
    descripcion: 'Musculación, funcional y clases de cross training.',
    capacidad: 40,
    precioHora: 8000,
    icono: 'gimnasio',
    color: '#06B6D4',
    categoria: 'Deportivo',
  },
  {
    id: 4,
    nombre: 'SUM · Salón de Usos Múltiples',
    descripcion: 'Eventos, asambleas y celebraciones. Hasta 120 personas.',
    capacidad: 120,
    precioHora: 25000,
    icono: 'sum',
    color: '#1E293B',
    categoria: 'Recreativo',
  },
  {
    id: 5,
    nombre: 'Sala de Ensayo',
    descripcion: 'Aislada y amplificada. Ideal para bandas y proyectos musicales.',
    capacidad: 8,
    precioHora: 5000,
    icono: 'ensayo',
    color: '#7C3AED',
    categoria: 'Cultural',
  },
];

/* ---------------------------------- reservas ---------------------------------- */

const d0 = todayISO();

export const reservasIniciales: Reserva[] = [
  { id: 1, espacioId: 1, socioId: 4, socioNombre: 'Mariana López', fecha: d0, inicio: '18:00', fin: '19:00', estado: 'confirmada', concepto: 'Partido equipo A vs B' },
  { id: 2, espacioId: 1, socioId: 5, socioNombre: 'Diego Correa', fecha: d0, inicio: '20:00', fin: '21:00', estado: 'confirmada' },
  { id: 3, espacioId: 2, socioId: 2, socioNombre: 'Julieta Méndez', fecha: d0, inicio: '10:00', fin: '12:00', estado: 'confirmada', concepto: 'Taller semanal' },
  { id: 4, espacioId: 2, socioId: 8, socioNombre: 'Lucía Benítez', fecha: toISODate(addDays(new Date(), 1)), inicio: '15:00', fin: '17:00', estado: 'confirmada' },
  { id: 5, espacioId: 3, socioId: 6, socioNombre: 'Sofía Almeida', fecha: d0, inicio: '09:00', fin: '10:00', estado: 'confirmada' },
  { id: 6, espacioId: 3, socioId: 10, socioNombre: 'Carla Ruiz', fecha: d0, inicio: '17:00', fin: '18:00', estado: 'confirmada' },
  { id: 7, espacioId: 4, socioId: 1, socioNombre: 'Carlos Kussi', fecha: toISODate(addDays(new Date(), 2)), inicio: '19:00', fin: '22:00', estado: 'confirmada', concepto: 'Asamblea general' },
  { id: 8, espacioId: 5, socioId: 12, socioNombre: 'Nadia Quiroga', fecha: d0, inicio: '19:00', fin: '21:00', estado: 'confirmada' },
  { id: 9, espacioId: 1, socioId: 3, socioNombre: 'Roberto Fernández', fecha: toISODate(addDays(new Date(), 1)), inicio: '19:00', fin: '20:00', estado: 'confirmada' },
  { id: 10, espacioId: 4, socioId: 2, socioNombre: 'Julieta Méndez', fecha: toISODate(addDays(new Date(), 1)), inicio: '11:00', fin: '13:00', estado: 'confirmada', concepto: 'Feria de comercios' },
  { id: 11, espacioId: 3, socioId: 7, socioNombre: 'Jorge Paredes', fecha: toISODate(addDays(new Date(), 1)), inicio: '18:00', fin: '19:00', estado: 'confirmada' },
  { id: 12, espacioId: 2, socioId: 4, socioNombre: 'Mariana López', fecha: toISODate(addDays(new Date(), 2)), inicio: '16:00', fin: '18:00', estado: 'confirmada' },
];

/* ---------------------------------- novedades ---------------------------------- */

export const novedadesIniciales: Novedad[] = [
  {
    id: 1,
    titulo: 'Asamblea General Ordinaria 2026',
    fecha: d0,
    categoria: 'Institucional',
    contenido:
      'Invitamos a todas las socias y socios a la Asamblea General Ordinaria el próximo sábado en el SUM. Se tratarán la memoria y balance del ejercicio y la renovación parcial de la comisión directiva. Habrá servicio de cantina durante el evento.',
    destacada: true,
    emoji: '🏛️',
  },
  {
    id: 2,
    titulo: 'Copa NODO de Fútbol 5',
    fecha: toISODate(addDays(new Date(), 3)),
    categoria: 'Evento',
    contenido:
      'Arranca el torneo interno más esperado del año. 16 equipos, modalidad liguilla y final en nuestra cancha. Inscripciones abiertas en recepción hasta el viernes.',
    destacada: true,
    emoji: '⚽',
  },
  {
    id: 3,
    titulo: 'Nuevas vacantes en Taller de Cerámica',
    fecha: d0,
    categoria: 'Comunicado',
    contenido:
      'Abrimos 8 nuevos cupos para el taller cultural de cerámica. Cursada semanal los martes y jueves. Reservá tu lugar desde la app y aboná tu cuota social al día.',
    destacada: false,
    emoji: '🏺',
  },
  {
    id: 4,
    titulo: 'Reajuste de cuota social 2026',
    fecha: d0,
    categoria: 'Comunicado',
    contenido:
      'Desde agosto la cuota activa pasa a $ 18.000 y la juvenil a $ 12.000. El beneficio de pago anticipado bimestral mantiene un 10% de descuento.',
    destacada: false,
    emoji: '📋',
  },
  {
    id: 5,
    titulo: 'Feria de Comercios Vecinales',
    fecha: toISODate(addDays(new Date(), 1)),
    categoria: 'Comunidad',
    contenido:
      'Este sábado el club abre sus puertas a la Feria de Comercios del barrio. 20 locales con descuentos exclusivos para socios. Entrada libre con carnet digital.',
    destacada: false,
    emoji: '🛍️',
  },
];

/* ---------------------------------- publicidades ---------------------------------- */

export const publicidadesIniciales: Publicidad[] = [
  {
    id: 1,
    negocio: 'Almacén La Vuelta',
    rubro: 'Alimentos',
    descuento: '15% OFF',
    descripcion: 'Descuento para socios presentando el carnet digital en caja.',
    color: '#059669',
    barrio: 'Villa Crespo',
    destacada: true,
  },
  {
    id: 2,
    negocio: 'Verdulería Pura Verdura',
    rubro: 'Alimentos',
    descuento: '10% OFF',
    descripcion: '10% en frutas y verduras de estación todos los días.',
    color: '#0D9488',
    barrio: 'Caballito',
    destacada: false,
  },
  {
    id: 3,
    negocio: 'Farmacia San Martín',
    rubro: 'Salud',
    descuento: '20% OFF',
    descripcion: 'Descuento en productos de venta libre con el carnet NODO.',
    color: '#06B6D4',
    barrio: 'Almagro',
    destacada: true,
  },
  {
    id: 4,
    negocio: 'Panadería El Trigal',
    rubro: 'Gastronomía',
    descuento: '10% OFF',
    descripcion: '10% en panificados artesanales de lunes a viernes.',
    color: '#F59E0B',
    barrio: 'Villa Crespo',
    destacada: false,
  },
  {
    id: 5,
    negocio: 'Barbería Corte Noble',
    rubro: 'Estética',
    descuento: '20% OFF',
    descripcion: 'Servicio completo con descuento para socios activos.',
    color: '#1E293B',
    barrio: 'Boedo',
    destacada: false,
  },
];

/* ---------------------------------- planes B2B ---------------------------------- */

export const planesB2B: PlanB2B[] = [
  {
    id: 'plan-100',
    nombre: 'Plan 100 Socios',
    socios: 'Hasta 100 socios',
    precioMensual: 89000,
    destacado: false,
    features: [
      'Carnet digital con QR para todos los socios',
      'Gestión de cuotas y cobranza',
      'Reservas de 2 instalaciones',
      '1 publicidad de comercio vecinal',
      'Soporte por WhatsApp',
    ],
  },
  {
    id: 'plan-250',
    nombre: 'Plan 250 Socios',
    socios: 'Hasta 250 socios',
    precioMensual: 149000,
    destacado: true,
    features: [
      'Todo lo del Plan 100',
      'Reservas ilimitadas de espacios y talleres',
      'Gráficos de morosidad y ocupación',
      'Recordatorios de pago por WhatsApp',
      '3 publicidades de comercios vecinales',
      'Panel de administración completo',
    ],
  },
  {
    id: 'plan-400',
    nombre: 'Plan 400+ Socios',
    socios: 'Sociedades, polideportivos y municipios',
    precioMensual: 219000,
    destacado: false,
    features: [
      'Todo lo del Plan 250',
      'Multisede y sucursales',
      'Integración con sistemas de facturación',
      'Módulo de eventos y torneos',
      'Gerente de cuenta dedicado',
    ],
  },
];

/* ---------------------------------- textos institucionales ---------------------------------- */

export const valueProps = [
  { titulo: 'Adiós al WhatsApp', detalle: 'Fin a los grupos caóticos de mensajes para anotarse o saber quién paga.' },
  { titulo: 'Adiós al Excel', detalle: 'Cuotas, socios y morosidad siempre actualizados, sin planillas sueltas.' },
  { titulo: 'Adiós a las carpetas', detalle: 'Reservas y comunicados en una única plataforma digital para toda la comunidad.' },
];
