/* Payload dinámico del QR del carnet digital NODO.
   Formato:  NODO|v1|<data-base64url>|<sig>
   data = JSON con { memberId, communityId, qrToken, ts } firmado con HMAC-SHA256.
   La firma autentica el payload y ts permite detectar códigos vencidos (replay). */

const VERSION = 'v1';
const QR_TTL_MIN = 15;

const SECRETO = 'nodo-carnet-dinamico-2026';

const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacHex(data) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRETO),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return toHex(new Uint8Array(sig));
}

function fallbackSig(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function randomToken() {
  const arr = crypto.getRandomValues(new Uint8Array(8));
  return toBase64Url(arr);
}

export async function firmarData(dataB64) {
  const data = encoder.encode(dataB64);
  if (crypto?.subtle) {
    try {
      return await hmacHex(data);
    } catch {
      return fallbackSig(dataB64);
    }
  }
  return fallbackSig(dataB64);
}

export async function createQrPayload({ memberId, communityId }) {
  const data = {
    memberId,
    communityId,
    qrToken: randomToken(),
    ts: Date.now(),
  };
  const dataB64 = toBase64Url(encoder.encode(JSON.stringify(data)));
  const sig = await firmarData(dataB64);
  return `NODO|${VERSION}|${dataB64}|${sig}`;
}

export async function verifyQrSignature(dataB64, sig) {
  const data = encoder.encode(dataB64);
  if (crypto?.subtle) {
    try {
      const esperada = await hmacHex(data);
      return esperada === sig;
    } catch {
      return fallbackSig(dataB64) === sig;
    }
  }
  return fallbackSig(dataB64) === sig;
}

export function parseQrPayload(raw) {
  const partes = String(raw || '')
    .trim()
    .split('|');
  if (partes.length !== 4 || partes[0] !== 'NODO' || partes[1] !== VERSION) {
    return { ok: false, error: 'Formato no reconocido' };
  }
  const [, , dataB64, sig] = partes;
  try {
    const json = JSON.parse(new TextDecoder().decode(fromBase64Url(dataB64)));
    return { ok: true, data: json, dataB64, sig };
  } catch {
    return { ok: false, error: 'Contenido ilegible' };
  }
}

export async function decodeQrPayload(raw) {
  const parsed = parseQrPayload(raw);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const valida = await verifyQrSignature(parsed.dataB64, parsed.sig);
  if (!valida) return { ok: false, error: 'Firma inválida' };
  const edadMs = Date.now() - parsed.data.ts;
  if (Number.isNaN(edadMs) || edadMs < 0 || edadMs > QR_TTL_MIN * 60 * 1000) {
    return { ok: false, error: 'Código vencido', expirado: true };
  }
  if (!parsed.data.memberId || !parsed.data.communityId) {
    return { ok: false, error: 'Datos incompletos' };
  }
  return { ok: true, data: parsed.data };
}

export const QR_VIGENCIA_MIN = QR_TTL_MIN;
