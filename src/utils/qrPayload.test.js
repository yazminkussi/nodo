import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createQrPayload,
  decodeQrPayload,
  parseQrPayload,
  verifyQrSignature,
  QR_VIGENCIA_MIN,
} from './qrPayload';

afterEach(() => {
  vi.useRealTimers();
});

describe('payload del carnet QR', () => {
  it('ida y vuelta: lo que se firma se puede leer', async () => {
    const raw = await createQrPayload({ memberId: 42, communityId: 'la-union' });
    expect(raw.startsWith('NODO|v1|')).toBe(true);

    const res = await decodeQrPayload(raw);
    expect(res.ok).toBe(true);
    expect(res.data.memberId).toBe(42);
    expect(res.data.communityId).toBe('la-union');
    expect(typeof res.data.qrToken).toBe('string');
  });

  it('rechaza un payload con la firma alterada', async () => {
    const raw = await createQrPayload({ memberId: 1, communityId: 'c' });
    const partes = raw.split('|');
    partes[3] = partes[3].slice(0, -1) + (partes[3].endsWith('a') ? 'b' : 'a');
    const res = await decodeQrPayload(partes.join('|'));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/firma/i);
  });

  it('rechaza un formato desconocido', () => {
    expect(parseQrPayload('cualquier cosa').ok).toBe(false);
    expect(parseQrPayload('NODO|v9|x|y').ok).toBe(false);
    expect(parseQrPayload('').ok).toBe(false);
  });

  it('marca como vencido un código viejo', async () => {
    const raw = await createQrPayload({ memberId: 7, communityId: 'c' });
    // avanza el reloj más allá del TTL
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + (QR_VIGENCIA_MIN + 1) * 60 * 1000);
    const res = await decodeQrPayload(raw);
    expect(res.ok).toBe(false);
    expect(res.expirado).toBe(true);
  });

  it('verifyQrSignature valida una firma correcta', async () => {
    const raw = await createQrPayload({ memberId: 3, communityId: 'c' });
    const { dataB64, sig } = parseQrPayload(raw);
    expect(await verifyQrSignature(dataB64, sig)).toBe(true);
    expect(await verifyQrSignature(dataB64, 'firma-falsa')).toBe(false);
  });
});
