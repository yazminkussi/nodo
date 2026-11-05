/* Lógica del chatbot de WhatsApp de NODO: entiende qué pide el socio y arma las
   respuestas. Son funciones puras (sin acceso a la base ni a la red) para poder
   testearlas; los datos los trae index.ts. */

export type Intencion =
  | 'menu'
  | 'cuota'
  | 'reservas'
  | 'espacios'
  | 'novedades'
  | 'carnet'
  | 'contacto'
  | 'gracias'
  | 'desconocido';

/** Minúsculas, sin tildes ni signos, espacios simples. */
export function normalizarTexto(texto: string): string {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PALABRAS: [Intencion, RegExp][] = [
  ['gracias', /\b(gracias|genial|perfecto|ok|dale|listo|chau|adios)\b/],
  ['cuota', /\b(cuota|cuotas|deuda|debo|adeudo|pago|pagar|pague|moroso|al dia)\b/],
  ['reservas', /\b(reserva|reservas|reserve|turno|turnos)\b/],
  [
    'espacios',
    /\b(espacio|espacios|horario|horarios|instalacion|instalaciones|cancha|canchas|gimnasio|pileta|salon|sum|abierto|abren|abre|cierra)\b/,
  ],
  ['novedades', /\b(novedad|novedades|noticia|noticias|evento|eventos|comunicado|comunicados)\b/],
  ['carnet', /\b(carnet|credencial|qr|entrar|ingreso|ingresar)\b/],
  [
    'contacto',
    /\b(contacto|telefono|secretaria|hablar|persona|humano|direccion|donde|mail|email)\b/,
  ],
  [
    'menu',
    /\b(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|menu|ayuda|inicio|hi|hello)\b/,
  ],
];

const NUMEROS: Record<string, Intencion> = {
  '0': 'menu',
  '1': 'cuota',
  '2': 'reservas',
  '3': 'espacios',
  '4': 'novedades',
  '5': 'carnet',
  '6': 'contacto',
};

export function detectarIntencion(texto: string): Intencion {
  const t = normalizarTexto(texto);
  if (!t) return 'menu';
  if (NUMEROS[t]) return NUMEROS[t];
  for (const [intencion, regex] of PALABRAS) {
    if (regex.test(t)) return intencion;
  }
  return 'desconocido';
}

/* ------------------------------ respuestas ------------------------------ */

const fechaCorta = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : String(iso);
};

const pesos = (n: number) => `$ ${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;

export function textoMenu(nombre?: string): string {
  const saludo = nombre ? `¡Hola ${nombre}! 👋` : '¡Hola! 👋';
  return [
    `${saludo} Soy el asistente de *NODO*. ¿En qué te ayudo?`,
    '',
    '*1* · Mi cuota',
    '*2* · Mis reservas',
    '*3* · Espacios y horarios',
    '*4* · Novedades del club',
    '*5* · Mi carnet digital',
    '*6* · Contacto del club',
    '',
    'Respondé con un número o escribime tu consulta.',
  ].join('\n');
}

export function textoSinFicha(appUrl: string): string {
  return [
    'Hola 👋 Soy el asistente de *NODO*, pero no encuentro este número en ningún club.',
    '',
    'Pedile a tu club que cargue tu celular en tu ficha de socio y volvé a escribirme.',
    `Mientras tanto podés entrar a la app: ${appUrl}`,
  ].join('\n');
}

export interface DatosCuota {
  nombre: string;
  club: string;
  cuotaAlDia: boolean;
  cuotaMonto: number;
  ultimaCuota: string | null;
}

export function textoCuota(d: DatosCuota, appUrl: string): string {
  if (d.cuotaAlDia) {
    return `✅ *${d.nombre}*, tu cuota en *${d.club}* está *al día*.\nÚltimo pago: ${fechaCorta(d.ultimaCuota)}.`;
  }
  return [
    `⚠️ *${d.nombre}*, tu cuota en *${d.club}* figura *pendiente*: ${pesos(d.cuotaMonto)}.`,
    `Última cuota paga: ${fechaCorta(d.ultimaCuota)}.`,
    '',
    `Podés ponerte al día desde la app: ${appUrl}`,
  ].join('\n');
}

export interface DatosReserva {
  fecha: string;
  inicio: string;
  fin: string;
  espacio: string;
}

export function textoReservas(reservas: DatosReserva[], club: string): string {
  if (reservas.length === 0) {
    return `No tenés reservas próximas en *${club}*. Podés reservar un espacio desde la app de NODO.`;
  }
  const lineas = reservas.map(
    (r) => `• ${fechaCorta(r.fecha)} · ${r.inicio} a ${r.fin} · ${r.espacio}`
  );
  return [`📅 Tus próximas reservas en *${club}*:`, ...lineas].join('\n');
}

export interface DatosEspacio {
  nombre: string;
  apertura?: string;
  cierre?: string;
  precioHora: number;
}

export function textoEspacios(espacios: DatosEspacio[], club: string): string {
  if (espacios.length === 0) {
    return `*${club}* todavía no tiene espacios disponibles para reservar.`;
  }
  const lineas = espacios.map((e) => {
    const horario = e.apertura && e.cierre ? `${e.apertura} a ${e.cierre}` : 'consultar horario';
    const precio = e.precioHora > 0 ? ` · ${pesos(e.precioHora)}/h` : '';
    return `• *${e.nombre}* · ${horario}${precio}`;
  });
  return [`🏟️ Espacios de *${club}*:`, ...lineas, '', 'Reservalos desde la app de NODO.'].join(
    '\n'
  );
}

export interface DatosNovedad {
  titulo: string;
  fecha: string;
}

export function textoNovedades(novedades: DatosNovedad[], club: string): string {
  if (novedades.length === 0) return `*${club}* no tiene novedades por ahora.`;
  const lineas = novedades.map((n) => `• ${fechaCorta(n.fecha)} · ${n.titulo}`);
  return [`📣 Novedades de *${club}*:`, ...lineas].join('\n');
}

export function textoCarnet(appUrl: string): string {
  return `🪪 Tu carnet digital con QR está en la app de NODO: ${appUrl}\nEntrá con tu cuenta y mostralo en el ingreso.`;
}

export interface DatosContacto {
  club: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

export function textoContacto(c: DatosContacto): string {
  const lineas = [`📞 Contacto de *${c.club}*:`];
  if (c.direccion) lineas.push(`• Dirección: ${c.direccion}`);
  if (c.telefono) lineas.push(`• Teléfono: ${c.telefono}`);
  if (c.email) lineas.push(`• Email: ${c.email}`);
  if (lineas.length === 1) lineas.push('El club todavía no cargó sus datos de contacto.');
  return lineas.join('\n');
}

export const textoGracias = '¡De nada! 😊 Cuando quieras escribime *menu* para ver las opciones.';

export const textoNoEntendi =
  'No te entendí 🤔 Respondé con un número del menú o escribime *menu* para verlo.';
