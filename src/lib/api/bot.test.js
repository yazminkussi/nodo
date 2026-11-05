import { createHmac } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  detectarIntencion,
  normalizarTexto,
  textoCuota,
  textoEspacios,
  textoMenu,
  textoNovedades,
  textoReservas,
  textoContacto,
} from '../../../supabase/functions/whatsapp-bot/bot.ts';
import {
  firmarTwilio,
  firmaValida,
  twiml,
} from '../../../supabase/functions/whatsapp-bot/twilio.ts';

describe('normalizarTexto', () => {
  it('saca tildes, signos y mayúsculas', () => {
    expect(normalizarTexto('  ¿Cuánta   DEUDA tengo?! ')).toBe('cuanta deuda tengo');
  });
  it('tolera valores vacíos', () => {
    expect(normalizarTexto(null)).toBe('');
  });
});

describe('detectarIntencion', () => {
  it.each([
    ['1', 'cuota'],
    ['2', 'reservas'],
    ['3', 'espacios'],
    ['4', 'novedades'],
    ['5', 'carnet'],
    ['6', 'contacto'],
    ['0', 'menu'],
    ['Hola', 'menu'],
    ['Buen día!', 'menu'],
    ['', 'menu'],
    ['¿Estoy al día con la cuota?', 'cuota'],
    ['cuánto debo', 'cuota'],
    ['quiero pagar', 'cuota'],
    ['mis reservas', 'reservas'],
    ['qué turno tengo', 'reservas'],
    ['a qué hora abre el gimnasio', 'espacios'],
    ['horarios de la pileta', 'espacios'],
    ['hay novedades?', 'novedades'],
    ['mi carnet', 'carnet'],
    ['cómo contacto a secretaría', 'contacto'],
    ['gracias!', 'gracias'],
    ['asdfgh', 'desconocido'],
  ])('"%s" -> %s', (texto, esperada) => {
    expect(detectarIntencion(texto)).toBe(esperada);
  });
});

describe('respuestas', () => {
  it('menú con nombre', () => {
    const t = textoMenu('Julieta');
    expect(t).toContain('Hola Julieta');
    for (const n of ['1', '2', '3', '4', '5', '6']) expect(t).toContain(`*${n}*`);
  });

  it('cuota al día', () => {
    const t = textoCuota(
      {
        nombre: 'Julieta',
        club: 'La Unión',
        cuotaAlDia: true,
        cuotaMonto: 18000,
        ultimaCuota: '2026-07-15',
      },
      'https://app'
    );
    expect(t).toContain('al día');
    expect(t).toContain('15/07/2026');
  });

  it('cuota pendiente con monto y enlace', () => {
    const t = textoCuota(
      {
        nombre: 'Diego',
        club: 'La Unión',
        cuotaAlDia: false,
        cuotaMonto: 18000,
        ultimaCuota: null,
      },
      'https://app'
    );
    expect(t).toContain('pendiente');
    expect(t).toContain('$ 18.000');
    expect(t).toContain('https://app');
    expect(t).toContain('—');
  });

  it('reservas: lista y vacío', () => {
    const lista = textoReservas(
      [{ fecha: '2026-11-10', inicio: '18:00', fin: '19:00', espacio: 'Gimnasio' }],
      'La Unión'
    );
    expect(lista).toContain('10/11/2026 · 18:00 a 19:00 · Gimnasio');
    expect(textoReservas([], 'La Unión')).toContain('No tenés reservas próximas');
  });

  it('espacios con horario y precio', () => {
    const t = textoEspacios(
      [
        { nombre: 'Gimnasio', apertura: '09:00', cierre: '22:00', precioHora: 8000 },
        { nombre: 'SUM', precioHora: 0 },
      ],
      'La Unión'
    );
    expect(t).toContain('*Gimnasio* · 09:00 a 22:00 · $ 8.000/h');
    expect(t).toContain('*SUM* · consultar horario');
  });

  it('novedades y contacto', () => {
    expect(textoNovedades([{ titulo: 'Asamblea', fecha: '2026-11-01' }], 'La Unión')).toContain(
      '01/11/2026 · Asamblea'
    );
    expect(textoNovedades([], 'La Unión')).toContain('no tiene novedades');
    expect(textoContacto({ club: 'La Unión', telefono: '11 4824-3000' })).toContain('11 4824-3000');
    expect(textoContacto({ club: 'La Unión' })).toContain('todavía no cargó');
  });
});

describe('firma de Twilio', () => {
  const token = 'token-de-prueba';
  const url = 'https://ejemplo.supabase.co/functions/v1/whatsapp-bot';
  const params = { From: 'whatsapp:+5491155551201', Body: 'Hola', To: 'whatsapp:+14155238886' };

  it('coincide con el algoritmo de Twilio (HMAC-SHA1 de URL + parámetros ordenados)', async () => {
    const esperada = createHmac('sha1', token)
      .update(`${url}BodyHolaFromwhatsapp:+5491155551201Towhatsapp:+14155238886`)
      .digest('base64');
    expect(await firmarTwilio(token, url, params)).toBe(esperada);
  });

  it('acepta una firma correcta y rechaza una alterada o ausente', async () => {
    const firma = await firmarTwilio(token, url, params);
    expect(await firmaValida(token, url, params, firma)).toBe(true);
    expect(await firmaValida(token, url, { ...params, Body: 'Otra cosa' }, firma)).toBe(false);
    expect(await firmaValida('otro-token', url, params, firma)).toBe(false);
    expect(await firmaValida(token, url, params, null)).toBe(false);
    expect(await firmaValida(token, url, params, 'xxx')).toBe(false);
  });
});

describe('twiml', () => {
  it('escapa los caracteres del XML', () => {
    expect(twiml('a & b <c>')).toContain('<Message>a &amp; b &lt;c&gt;</Message>');
  });
  it('recorta mensajes muy largos', () => {
    const xml = twiml('x'.repeat(3000));
    expect(xml.length).toBeLessThan(1700);
    expect(xml).toContain('...');
  });
});
