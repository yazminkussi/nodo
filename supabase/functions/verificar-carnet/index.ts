/* Edge Function: verificar-carnet
   El panel de control de acceso manda acá el texto escaneado. La función:
     1. valida la firma HMAC con el secreto del servidor,
     2. controla vencimiento (TTL) y que el QR sea de esta comunidad,
     3. busca la ficha del socio y su estado de cuota,
     4. busca una reserva del socio para hoy,
     5. registra el ingreso en `registros_acceso`,
     6. devuelve el resultado listo para mostrar.

   POST { payload, comunidadId, metodo?, escaneadoPor?, override?, socioId? }
   Requiere sesión de un admin de la comunidad.

   Archivo autocontenido a propósito: se pega tal cual en el editor de
   Edge Functions del panel de Supabase. */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const VERSION = 'v1';
const TTL_MIN = 15;
const ROLES_ADMIN = ['superadmin', 'deportes', 'talleres'];
const enc = new TextEncoder();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function unb64url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return hex(new Uint8Array(sig));
}

/** Comparación en tiempo constante (evita timing attacks sobre la firma). */
function igualdadSegura(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

type Verificacion =
  | { ok: true; data: { memberId: string | number; communityId: string; ts: number } }
  | { ok: false; error: string; expirado?: boolean };

async function verificarCarnet(secret: string, raw: string): Promise<Verificacion> {
  const partes = String(raw || '')
    .trim()
    .split('|');
  if (partes.length !== 4 || partes[0] !== 'NODO' || partes[1] !== VERSION) {
    return { ok: false, error: 'Formato no reconocido' };
  }
  const [, , dataB64, sig] = partes;

  const esperada = await hmacHex(secret, dataB64);
  if (!igualdadSegura(esperada, sig)) return { ok: false, error: 'Firma inválida' };

  let data: { memberId: string | number; communityId: string; ts: number };
  try {
    data = JSON.parse(new TextDecoder().decode(unb64url(dataB64)));
  } catch {
    return { ok: false, error: 'Contenido ilegible' };
  }

  const edadMs = Date.now() - data.ts;
  if (!(edadMs >= 0) || edadMs > TTL_MIN * 60 * 1000) {
    return { ok: false, error: 'Código vencido', expirado: true };
  }
  if (!data.memberId || !data.communityId) return { ok: false, error: 'Datos incompletos' };
  return { ok: true, data };
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

interface Body {
  payload?: string;
  comunidadId?: string;
  metodo?: 'qr' | 'manual';
  escaneadoPor?: string;
  override?: boolean;
  socioId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const secret = Deno.env.get('CARNET_SECRET');
  if (!secret) return json({ error: 'CARNET_SECRET no configurado en la función' }, 500);

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'No autenticado' }, 401);

  const authClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return json({ error: 'No autenticado' }, 401);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Body inválido' }, 400);
  }
  const { payload, comunidadId, metodo = 'qr', escaneadoPor, override = false, socioId } = body;
  if (!comunidadId) return json({ error: 'Falta comunidadId' }, 400);

  const admin = createClient(url, service, { auth: { persistSession: false } });

  const { data: memb } = await admin
    .from('membresias')
    .select('rol')
    .eq('perfil_id', user.id)
    .eq('comunidad_id', comunidadId)
    .eq('estado', 'activa')
    .maybeSingle();
  if (!memb || !ROLES_ADMIN.includes(memb.rol)) {
    return json({ error: 'No sos administrador de esta comunidad' }, 403);
  }

  const { data: comunidad } = await admin
    .from('comunidades')
    .select('id, nombre')
    .eq('id', comunidadId)
    .maybeSingle();

  // ---- resolver el socio ------------------------------------------------
  let socio: Record<string, unknown> | null = null;
  let resultado: 'permitido' | 'denegado' | 'invalido' = 'invalido';
  let motivo = '';
  let comunidadIncorrecta = false;

  if (socioId) {
    const { data } = await admin
      .from('socios')
      .select('*')
      .eq('id', socioId)
      .eq('comunidad_id', comunidadId)
      .maybeSingle();
    socio = data;
    if (!socio) motivo = 'No se encontró ningún socio.';
  } else {
    const verif = await verificarCarnet(secret, payload ?? '');
    if (!verif.ok) {
      motivo = verif.expirado
        ? 'Este QR está vencido. Pedile al socio que actualice su carnet.'
        : verif.error === 'Firma inválida'
          ? 'El código fue alterado o no lo emitió NODO.'
          : 'El código no es un carnet NODO válido.';
    } else if (String(verif.data.communityId) !== comunidadId) {
      comunidadIncorrecta = true;
      motivo = 'El QR pertenece a otra institución.';
    } else {
      const { data } = await admin
        .from('socios')
        .select('*')
        .eq('id', verif.data.memberId)
        .eq('comunidad_id', comunidadId)
        .maybeSingle();
      socio = data;
      if (!socio) motivo = 'No se encontró un socio con este carnet.';
    }
  }

  // ---- estado de cuota + reserva -------------------------------------
  let estadoAlIngreso = '—';
  let reserva: { espacioNombre: string; hora: string } | null = null;

  if (socio) {
    const alDia = Boolean(socio.cuota_al_dia);
    estadoAlIngreso = alDia ? 'Al día' : 'Adeuda';
    if (override) {
      resultado = 'permitido';
      motivo = motivo || 'Ingreso autorizado manualmente por administración.';
    } else if (alDia) {
      resultado = 'permitido';
      motivo = 'Cuotas al día.';
    } else {
      resultado = 'denegado';
      motivo = 'Cuota social adeudada.';
    }

    const { data: r } = await admin
      .from('reservas')
      .select('inicio, espacio:espacios(nombre)')
      .eq('socio_id', socio.id)
      .eq('fecha', hoyISO())
      .neq('estado', 'cancelada')
      .order('inicio', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (r) {
      const esp = Array.isArray(r.espacio) ? r.espacio[0] : r.espacio;
      reserva = { espacioNombre: esp?.nombre ?? 'Espacio', hora: r.inicio };
    }
  }

  // ---- registrar el ingreso ----------------------------------------
  const nombreSocio = socio ? `${socio.nombre} ${socio.apellido}` : 'Desconocido';
  const timestamp = new Date().toISOString();
  await admin.from('registros_acceso').insert({
    usuario_id: null,
    numero_socio: socio?.numero ?? '—',
    nombre: nombreSocio,
    comunidad_id: comunidadId,
    comunidad_nombre: comunidad?.nombre ?? null,
    timestamp,
    estado_al_ingreso: estadoAlIngreso,
    resultado,
    motivo,
    escaneado_por: escaneadoPor ?? user.email ?? 'Operador',
    metodo,
    detalle_reserva: reserva ? `${reserva.espacioNombre} · ${reserva.hora} hs` : null,
    override,
  });

  return json({
    resultado,
    motivo,
    estadoAlIngreso,
    comunidadIncorrecta,
    timestamp,
    socio: socio
      ? {
          id: socio.id,
          numero: socio.numero,
          nombre: socio.nombre,
          apellido: socio.apellido,
          cuotaAlDia: Boolean(socio.cuota_al_dia),
          plan: socio.cuota_monto ?? 0,
          ultimaCuota: socio.ultima_cuota ?? null,
        }
      : null,
    reserva,
  });
});
