/* Edge Function: carnet-token
   Devuelve un payload de carnet FIRMADO para el socio de la cuenta que llama.
   El secreto (CARNET_SECRET) vive sólo en el servidor: el cliente ya no puede
   fabricar un carnet válido.

   POST { comunidadId }  ->  { payload, expiraEnMin }
   Requiere sesión (JWT).

   Archivo autocontenido a propósito: se pega tal cual en el editor de
   Edge Functions del panel de Supabase. */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const VERSION = 'v1';
const TTL_MIN = 15;
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

function b64url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

async function firmarCarnet(
  secret: string,
  payload: { memberId: string | number; communityId: string }
): Promise<string> {
  const data = {
    memberId: payload.memberId,
    communityId: payload.communityId,
    qrToken: b64url(crypto.getRandomValues(new Uint8Array(8))),
    ts: Date.now(),
  };
  const dataB64 = b64url(enc.encode(JSON.stringify(data)));
  const sig = await hmacHex(secret, dataB64);
  return `NODO|${VERSION}|${dataB64}|${sig}`;
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

  let comunidadId: string | undefined;
  try {
    ({ comunidadId } = await req.json());
  } catch {
    return json({ error: 'Body inválido' }, 400);
  }
  if (!comunidadId) return json({ error: 'Falta comunidadId' }, 400);

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: socio, error } = await admin
    .from('socios')
    .select('id, numero')
    .eq('comunidad_id', comunidadId)
    .eq('perfil_id', user.id)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!socio) return json({ error: 'La cuenta no tiene ficha de socio en esta comunidad' }, 404);

  const payload = await firmarCarnet(secret, { memberId: socio.id, communityId: comunidadId });
  return json({ payload, expiraEnMin: TTL_MIN });
});
