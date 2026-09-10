/* Edge Function: enviar-invitacion
   Manda por email una invitación de administrador ya creada. La invitación en sí
   se sigue creando desde la app (tabla `invitaciones`); esto sólo envía el mail.

   POST { invitacionId }  ->  { enviado: boolean, motivo?: string }
   Requiere sesión de un superadmin de la comunidad.

   Config (Edge Functions → Secrets):
     RESEND_API_KEY   obligatorio para enviar (si falta, la función responde
                      { enviado: false, motivo: "sin_config" } sin error).
     NODO_APP_URL     URL de la app (default: la de Vercel).
     NODO_EMAIL_FROM  remitente (default: "NODO <onboarding@resend.dev>").

   Archivo autocontenido: se pega tal cual en el editor del panel de Supabase. */

import { createClient } from 'jsr:@supabase/supabase-js@2';

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

const ROLES: Record<string, string> = {
  superadmin: 'SuperAdmin / Tesorero',
  deportes: 'Admin de Deportes',
  talleres: 'Admin de Talleres / Cultura',
};

const esc = (s: string) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );

function plantilla(club: string, rol: string, email: string, url: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#F8F6F1;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#20202A">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F6F1;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(50,50,142,.12)">
        <tr><td style="background:#32328E;padding:22px 28px;color:#F3EFE6;font-weight:700;font-size:18px;letter-spacing:-.01em">nodo</td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3">Te invitaron a administrar <strong>${esc(club)}</strong></h1>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#4A4A57">
            Vas a tener el rol de <strong>${esc(rol)}</strong> en NODO, la app del club.
          </p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4A4A57">
            Registrate con <strong>este mismo email</strong> (<code>${esc(email)}</code>) y el rol se activa solo la primera vez que entres.
          </p>
          <a href="${esc(url)}" style="display:inline-block;background:#32328E;color:#F3EFE6;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:12px">Ir a NODO</a>
          <p style="margin:22px 0 0;font-size:12px;color:#8A8A97">
            Si no esperabas esta invitación, podés ignorar este mensaje.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

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

  let invitacionId: string | undefined;
  try {
    ({ invitacionId } = await req.json());
  } catch {
    return json({ error: 'Body inválido' }, 400);
  }
  if (!invitacionId) return json({ error: 'Falta invitacionId' }, 400);

  const admin = createClient(url, service, { auth: { persistSession: false } });

  const { data: inv } = await admin
    .from('invitaciones')
    .select('email, rol, comunidad_id, estado')
    .eq('id', invitacionId)
    .maybeSingle();
  if (!inv) return json({ error: 'La invitación no existe' }, 404);

  const { data: memb } = await admin
    .from('membresias')
    .select('rol')
    .eq('perfil_id', user.id)
    .eq('comunidad_id', inv.comunidad_id)
    .eq('estado', 'activa')
    .maybeSingle();
  if (!memb || memb.rol !== 'superadmin') {
    return json({ error: 'No autorizado' }, 403);
  }

  const RESEND = Deno.env.get('RESEND_API_KEY');
  if (!RESEND) return json({ enviado: false, motivo: 'sin_config' });

  const { data: comunidad } = await admin
    .from('comunidades')
    .select('nombre')
    .eq('id', inv.comunidad_id)
    .maybeSingle();

  const appUrl =
    Deno.env.get('NODO_APP_URL') ?? 'https://nodo-yazminkussi-8286s-projects.vercel.app';
  const from = Deno.env.get('NODO_EMAIL_FROM') ?? 'NODO <onboarding@resend.dev>';
  const club = comunidad?.nombre ?? 'tu club';
  const rolLindo = ROLES[inv.rol] ?? inv.rol;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: inv.email,
      subject: `Te invitaron a administrar ${club} en NODO`,
      html: plantilla(club, rolLindo, inv.email, appUrl),
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    return json({ enviado: false, motivo: 'resend_error', detalle }, 502);
  }
  return json({ enviado: true });
});
