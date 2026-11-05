/* Edge Function: enviar-recordatorio
   Manda por WhatsApp (API de Kapso) el recordatorio de cuota a un socio que adeuda.
   El mensaje sale desde el número de WhatsApp Business del club, sin que nadie
   tenga que apretar "enviar" en un celular.

   POST { socioId }  ->  { enviado: true }
                       | { enviado: false, motivo: "sin_config" }   (Kapso sin configurar)
                       | 4xx/5xx { error, motivo }

   Reglas (todas del lado del servidor):
     · requiere sesión de un superadmin (tesorería) del club del socio;
     · el plan del club tiene que incluir recordatorios (Plan 250 o superior);
     · el socio tiene que adeudar la cuota y tener un celular válido;
     · máximo un recordatorio por socio cada 24 hs.

   Config (Edge Functions → Secrets):
     KAPSO_API_KEY          obligatorio (Kapso → Integrations → API keys)
     KAPSO_PHONE_NUMBER_ID  obligatorio (Kapso → WhatsApp → Phone numbers)
     KAPSO_TEMPLATE_NAME    plantilla aprobada (default: recordatorio_cuota)
     KAPSO_TEMPLATE_LANG    idioma de la plantilla (default: es_AR)

   La plantilla tiene 3 variables posicionales:
     {{1}} nombre del socio · {{2}} nombre del club · {{3}} monto adeudado
   Ver docs/KAPSO.md. */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { formatearMonto, normalizarCelular } from '../_shared/telefono.ts';

const KAPSO_BASE = 'https://api.kapso.ai/meta/whatsapp/v24.0';
const VENTANA_HORAS = 24;

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

const fallo = (status: number, motivo: string, error: string) => json({ error, motivo }, status);

/** Mensaje legible de un error de Kapso (el formato cambia según el código). */
function detalleKapso(cuerpo: unknown): string {
  const e = (cuerpo as { error?: unknown } | null)?.error;
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  const m2 = (cuerpo as { message?: unknown } | null)?.message;
  return typeof m2 === 'string' ? m2 : 'Respuesta inesperada de Kapso';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return fallo(405, 'metodo', 'Método no permitido');

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!jwt) return fallo(401, 'auth', 'No autenticado');

  const authClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return fallo(401, 'auth', 'No autenticado');

  let socioId: string | undefined;
  try {
    ({ socioId } = await req.json());
  } catch {
    return fallo(400, 'body', 'Body inválido');
  }
  if (!socioId) return fallo(400, 'body', 'Falta socioId');

  const admin = createClient(url, service, { auth: { persistSession: false } });

  const { data: socio } = await admin
    .from('socios')
    .select('id, comunidad_id, nombre, celular, cuota_al_dia, cuota_monto')
    .eq('id', socioId)
    .maybeSingle();
  if (!socio) return fallo(404, 'socio', 'El socio no existe');

  // Sólo tesorería (superadmin) del club del socio.
  const { data: memb } = await admin
    .from('membresias')
    .select('rol')
    .eq('perfil_id', user.id)
    .eq('comunidad_id', socio.comunidad_id)
    .eq('estado', 'activa')
    .maybeSingle();
  if (!memb || memb.rol !== 'superadmin') return fallo(403, 'permiso', 'No autorizado');

  // El plan del club tiene que incluir recordatorios.
  const { data: club } = await admin
    .from('comunidades')
    .select('nombre, plan_id, planes(recordatorios)')
    .eq('id', socio.comunidad_id)
    .maybeSingle();
  const planes = club?.planes as { recordatorios?: boolean } | { recordatorios?: boolean }[] | null;
  const incluye = Array.isArray(planes) ? planes[0]?.recordatorios : planes?.recordatorios;
  if (!incluye) {
    return fallo(403, 'plan', 'Los recordatorios por WhatsApp son del Plan 250 o superior.');
  }

  if (socio.cuota_al_dia) return fallo(409, 'al_dia', 'El socio tiene la cuota al día.');

  const to = normalizarCelular(socio.celular ?? '');
  if (!to) {
    return fallo(
      422,
      'sin_celular',
      'El socio no tiene un celular válido cargado. Editá su ficha y agregalo.'
    );
  }

  // Un recordatorio por socio cada 24 hs.
  const desde = new Date(Date.now() - VENTANA_HORAS * 3600 * 1000).toISOString();
  const { data: reciente } = await admin
    .from('recordatorios_whatsapp')
    .select('creado_en')
    .eq('socio_id', socio.id)
    .eq('estado', 'enviado')
    .gte('creado_en', desde)
    .order('creado_en', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (reciente) {
    return fallo(
      429,
      'reciente',
      'Ya le mandaste un recordatorio a este socio en las últimas 24 horas.'
    );
  }

  const apiKey = Deno.env.get('KAPSO_API_KEY');
  const phoneId = Deno.env.get('KAPSO_PHONE_NUMBER_ID');
  if (!apiKey || !phoneId) return json({ enviado: false, motivo: 'sin_config' });

  const plantilla = Deno.env.get('KAPSO_TEMPLATE_NAME') ?? 'recordatorio_cuota';
  const idioma = Deno.env.get('KAPSO_TEMPLATE_LANG') ?? 'es_AR';

  let estado: 'enviado' | 'error' = 'error';
  let mensajeId: string | null = null;
  let detalle = '';

  try {
    const res = await fetch(`${KAPSO_BASE}/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: plantilla,
          language: { code: idioma },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: socio.nombre },
                { type: 'text', text: club?.nombre ?? 'tu club' },
                { type: 'text', text: formatearMonto(socio.cuota_monto) },
              ],
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const cuerpo = await res.json().catch(() => null);
    if (res.ok) {
      estado = 'enviado';
      mensajeId = (cuerpo as { messages?: { id?: string }[] } | null)?.messages?.[0]?.id ?? null;
    } else {
      detalle = `${res.status}: ${detalleKapso(cuerpo)}`;
    }
  } catch (e) {
    detalle = e instanceof Error ? e.message : 'No se pudo conectar con Kapso';
  }

  await admin.from('recordatorios_whatsapp').insert({
    comunidad_id: socio.comunidad_id,
    socio_id: socio.id,
    enviado_por: user.id,
    estado,
    kapso_message_id: mensajeId,
    detalle: detalle || null,
  });

  if (estado === 'enviado') return json({ enviado: true });
  return json(
    {
      error: 'WhatsApp no aceptó el mensaje. Probá de nuevo en unos minutos.',
      motivo: 'kapso_error',
      detalle,
    },
    502
  );
});
