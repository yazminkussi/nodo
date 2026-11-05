/* Twilio: validación de la firma de los webhooks y armado de la respuesta TwiML.

   Firma (docs de Twilio): base64( HMAC-SHA1( authToken,
     URL completa + cada parámetro del formulario ordenado por nombre, como nombre+valor ) )
   y viaja en el encabezado X-Twilio-Signature. Sin esta validación cualquiera podría
   hacerle hablar al bot haciéndose pasar por Twilio. */

const enc = new TextEncoder();

function aBase64(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

export async function firmarTwilio(
  authToken: string,
  url: string,
  params: Record<string, string>
): Promise<string> {
  const datos = Object.keys(params)
    .sort()
    .reduce((acc, k) => acc + k + params[k], url);
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  return aBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(datos))));
}

/** Compara en tiempo constante para no filtrar información por la demora. */
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function firmaValida(
  authToken: string,
  url: string,
  params: Record<string, string>,
  firmaRecibida: string | null
): Promise<boolean> {
  if (!firmaRecibida) return false;
  return iguales(await firmarTwilio(authToken, url, params), firmaRecibida);
}

const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Respuesta TwiML con un único mensaje de WhatsApp (límite de WhatsApp: 1600 caracteres). */
export function twiml(texto: string): string {
  const cuerpo = texto.length > 1500 ? `${texto.slice(0, 1497)}...` : texto;
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escXml(cuerpo)}</Message></Response>`;
}
