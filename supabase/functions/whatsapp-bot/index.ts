/* Edge Function: whatsapp-bot
   Chatbot de WhatsApp de NODO sobre el sandbox de Twilio. Cuando un socio le
   escribe, el bot lo reconoce por su número de celular (el que figura en su ficha)
   y le responde con datos reales: cuota, reservas, espacios y horarios, novedades,
   carnet y contacto del club.

   Twilio llama a esta función (webhook "When a message comes in"):
     POST application/x-www-form-urlencoded  (From=whatsapp:+549…, Body=…)
   y responde con un TwiML (XML) con el mensaje de vuelta.

   Seguridad:
     · Valida la firma X-Twilio-Signature con TWILIO_AUTH_TOKEN: sólo responde a
       pedidos que vengan realmente de Twilio. Por eso se despliega SIN verificación
       JWT de Supabase (Twilio no manda un JWT).
     · Sólo muestra datos de la ficha cuyo celular coincide con el número que escribe.

   Config (Edge Functions → Secrets):
     TWILIO_AUTH_TOKEN  obligatorio (Twilio Console → Account info → Auth Token)
     BOT_PUBLIC_URL     opcional; por defecto <SUPABASE_URL>/functions/v1/whatsapp-bot.
                        Tiene que ser EXACTAMENTE la URL que se cargó en Twilio.
     NODO_APP_URL       URL de la app (default: la de Vercel)

   Ver docs/CHATBOT.md. */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { normalizarCelular } from '../_shared/telefono.ts';
import { firmaValida, twiml } from './twilio.ts';
import {
  detectarIntencion,
  textoCarnet,
  textoContacto,
  textoCuota,
  textoEspacios,
  textoGracias,
  textoMenu,
  textoNoEntendi,
  textoNovedades,
  textoReservas,
  textoSinFicha,
} from './bot.ts';
import type { DatosEspacio, DatosNovedad, DatosReserva } from './bot.ts';

// deno-lint-ignore no-explicit-any
type Fila = Record<string, any>;

/** PostgREST devuelve una relación como objeto o como lista de uno. */
const uno = (x: unknown): Fila | null =>
  Array.isArray(x) ? (x[0] ?? null) : ((x as Fila) ?? null);

const respuesta = (texto: string, status = 200) =>
  new Response(twiml(texto), {
    status,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });

/** Fecha de hoy en Argentina (YYYY-MM-DD). */
const hoyAR = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Método no permitido', { status: 405 });

  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!authToken) return new Response('Bot sin configurar', { status: 503 });

  const cuerpo = await req.text();
  const params = Object.fromEntries(new URLSearchParams(cuerpo)) as Record<string, string>;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const urlPublica = Deno.env.get('BOT_PUBLIC_URL') ?? `${supabaseUrl}/functions/v1/whatsapp-bot`;
  const valida = await firmaValida(
    authToken,
    urlPublica,
    params,
    req.headers.get('X-Twilio-Signature')
  );
  if (!valida) return new Response('Firma inválida', { status: 403 });

  const appUrl = Deno.env.get('NODO_APP_URL') ?? 'https://nodo-wheat.vercel.app';
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { persistSession: false },
  });

  try {
    const celular = normalizarCelular((params.From ?? '').replace(/^whatsapp:/, ''));
    if (!celular) return respuesta(textoSinFicha(appUrl));

    // Fichas cuyo celular coincide con quien escribe. Se acota por los últimos 4
    // dígitos en la base y se confirma el número completo normalizado acá.
    const { data: candidatos } = await admin
      .from('socios')
      .select(
        'id, comunidad_id, nombre, celular, cuota_al_dia, cuota_monto, ultima_cuota, ' +
          'comunidades(nombre, telefono, email, direccion, planes(limite_espacios))'
      )
      .ilike('celular', `%${celular.slice(-4)}%`)
      .limit(50);
    const socios = ((candidatos ?? []) as Fila[]).filter(
      (s) => normalizarCelular(s.celular ?? '') === celular
    );
    if (socios.length === 0) return respuesta(textoSinFicha(appUrl));

    const club = (s: Fila): string => uno(s.comunidades)?.nombre ?? 'tu club';
    // Un club por ficha distinta (una persona puede ser socia de más de uno).
    const clubes = [...new Map(socios.map((s) => [s.comunidad_id, s])).values()];

    const intencion = detectarIntencion(params.Body ?? '');
    const partes: string[] = [];

    switch (intencion) {
      case 'menu':
        return respuesta(textoMenu(socios[0].nombre));
      case 'gracias':
        return respuesta(textoGracias);
      case 'desconocido':
        return respuesta(textoNoEntendi);
      case 'carnet':
        return respuesta(textoCarnet(appUrl));

      case 'cuota':
        for (const s of socios) {
          partes.push(
            textoCuota(
              {
                nombre: s.nombre,
                club: club(s),
                cuotaAlDia: Boolean(s.cuota_al_dia),
                cuotaMonto: s.cuota_monto,
                ultimaCuota: s.ultima_cuota,
              },
              appUrl
            )
          );
        }
        break;

      case 'reservas':
        for (const s of socios) {
          const { data } = await admin
            .from('reservas')
            .select('fecha, inicio, fin, espacios(nombre)')
            .eq('socio_id', s.id)
            .neq('estado', 'cancelada')
            .gte('fecha', hoyAR())
            .order('fecha', { ascending: true })
            .order('inicio', { ascending: true })
            .limit(5);
          const lista: DatosReserva[] = ((data ?? []) as Fila[]).map((r) => ({
            fecha: r.fecha,
            inicio: r.inicio,
            fin: r.fin,
            espacio: uno(r.espacios)?.nombre ?? 'Espacio',
          }));
          partes.push(textoReservas(lista, club(s)));
        }
        break;

      case 'espacios':
        for (const s of clubes) {
          const { data } = await admin
            .from('espacios')
            .select('nombre, precio_hora, horario')
            .eq('comunidad_id', s.comunidad_id)
            .eq('disponible', true)
            .order('creado_en', { ascending: true });
          // Con un plan menor sólo se ven los primeros espacios que entran en el plan.
          const tope = uno(uno(s.comunidades)?.planes)?.limite_espacios ?? null;
          const visibles = tope === null ? (data ?? []) : (data ?? []).slice(0, tope);
          const lista: DatosEspacio[] = (visibles as Fila[]).map((e) => ({
            nombre: e.nombre,
            apertura: e.horario?.apertura,
            cierre: e.horario?.cierre,
            precioHora: e.precio_hora,
          }));
          partes.push(textoEspacios(lista, club(s)));
        }
        break;

      case 'novedades':
        for (const s of clubes) {
          const { data } = await admin
            .from('novedades')
            .select('titulo, fecha')
            .eq('comunidad_id', s.comunidad_id)
            .order('fecha', { ascending: false })
            .limit(3);
          partes.push(textoNovedades((data ?? []) as DatosNovedad[], club(s)));
        }
        break;

      case 'contacto':
        for (const s of clubes) {
          const c = uno(s.comunidades) ?? {};
          partes.push(
            textoContacto({
              club: club(s),
              telefono: c.telefono,
              email: c.email,
              direccion: c.direccion,
            })
          );
        }
        break;
    }

    return respuesta(partes.join('\n\n'));
  } catch (e) {
    console.error('whatsapp-bot', e instanceof Error ? e.message : e);
    return respuesta('Tuve un problema para responderte 😕 Probá de nuevo en unos minutos.');
  }
});
