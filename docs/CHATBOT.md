# Chatbot de WhatsApp (Twilio)

Un asistente de WhatsApp que responde con **datos reales de NODO**. El socio le
escribe al número del bot y este lo reconoce por el celular que figura en su ficha.

```
Socio (WhatsApp) ─► Twilio Sandbox ─► Edge Function whatsapp-bot ─► Supabase (datos del socio)
                                          │ valida la firma de Twilio
                                          └─► responde con TwiML ─► Twilio ─► Socio
```

No usa una cuenta de WhatsApp Business propia: corre sobre el **sandbox de WhatsApp de
Twilio**, pensado para pruebas y demos.

## Qué sabe responder

| El socio escribe…                      | Respuesta                                       |
| -------------------------------------- | ----------------------------------------------- |
| `hola`, `menu`, `0`                    | Saludo con el menú de opciones                  |
| `1` · "mi cuota", "cuánto debo"        | Si está al día o cuánto debe, y la última cuota |
| `2` · "mis reservas", "turno"          | Sus próximas reservas (hasta 5)                 |
| `3` · "horarios", "cancha", "gimnasio" | Espacios del club con horario y precio por hora |
| `4` · "novedades", "eventos"           | Las 3 últimas novedades del club                |
| `5` · "carnet", "qr"                   | Enlace a la app para ver el carnet              |
| `6` · "contacto", "secretaría"         | Dirección, teléfono y email del club            |
| cualquier otra cosa                    | "No te entendí" + cómo ver el menú              |

- Si el número **no figura en ninguna ficha**, el bot lo dice y explica cómo resolverlo.
- Si la persona es socia de **más de un club**, responde por cada uno.
- Con un plan menor, los espacios que muestra son los mismos que ve la app (los
  primeros que entran en el plan).
- El bot **no tiene IA**: entiende palabras clave y números. Es predecible y gratis.

## Seguridad

- Valida la firma `X-Twilio-Signature` con tu Auth Token: sólo responde a pedidos que
  vienen de Twilio. Por eso se despliega **sin verificación JWT** de Supabase.
- Sólo muestra datos de la ficha cuyo celular coincide con el número que escribe
  (el número lo garantiza WhatsApp).
- El Auth Token vive sólo como secreto del servidor.

## Puesta en marcha

### 1. En Twilio

1. Creá la cuenta en https://www.twilio.com/try-twilio (la prueba gratuita alcanza).
2. Andá a **Messaging → Try it out → Send a WhatsApp message** (sandbox de WhatsApp).
   Ahí ves el número del sandbox (`+1 415 523 8886`) y un código `join xxxx-xxxx`.
3. Desde **tu** WhatsApp, mandale ese mensaje (`join xxxx-xxxx`) a ese número. Twilio
   confirma que quedaste unida/o. **Cada persona que quiera hablar con el bot tiene que
   hacer esto una vez** (y repetirlo cada 3 días).
4. En **Sandbox settings**, en _"When a message comes in"_, pegá esta URL con método
   **POST** y guardá:

   ```
   https://qhbvcpkogbrfnbwqyubv.supabase.co/functions/v1/whatsapp-bot
   ```

### 2. En Supabase (proyecto de la app)

1. Cargá el Auth Token de Twilio como secreto (Twilio Console → _Account info_ → _Auth
   Token_). Hacelo en tu terminal, **no lo pegues en ningún chat**:

   ```bash
   npx supabase secrets set TWILIO_AUTH_TOKEN=<tu-auth-token> --project-ref qhbvcpkogbrfnbwqyubv
   ```

2. Desplegá la función. Lleva `--no-verify-jwt` porque Twilio no manda JWT (la seguridad
   la da la firma):

   ```bash
   npx supabase functions deploy whatsapp-bot --project-ref qhbvcpkogbrfnbwqyubv --use-api --no-verify-jwt
   ```

### 3. Cargar el celular de un socio

El bot reconoce al socio por el celular de su ficha. En **Socios**, editá una ficha y
cargá **tu** número, con el final seguido (como en `54 9 11 5555-1201`). Formatos
aceptados: `54 9 11 5555-1201`, `11 5555-1201`, `011 15 5555-1201`.

### 4. Probar

Desde tu WhatsApp, al número del sandbox: `hola` → te saluda por tu nombre y muestra el
menú. Probá `1`, `2`, `3`, `4`, `5` y `6`.

## Guion para la demo

1. `hola` → saludo y menú.
2. `1` → "tu cuota figura pendiente: $ 18.000" (o "al día").
3. `3` → los espacios del club con sus horarios.
4. `4` → las novedades que cargó el club.
5. Cambiá algo en la app (por ejemplo, registrá el pago de la cuota) y volvé a mandar `1`:
   la respuesta cambia, porque el bot lee los datos en el momento.

## Errores frecuentes

| Qué pasa                                  | Causa y solución                                                                                                                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El bot no contesta nada                   | No hiciste el `join` (o pasaron 3 días), o el webhook de Twilio no apunta a la URL de arriba. Mirá _Monitor → Logs → Errors_ en Twilio.                                                        |
| Twilio muestra error 11200 / 403          | La firma no coincide. Revisá que el secreto `TWILIO_AUTH_TOKEN` sea el correcto y que la URL cargada en Twilio sea **exactamente** la de arriba. Si usás otra, definila como `BOT_PUBLIC_URL`. |
| "no encuentro este número en ningún club" | El celular no está cargado en la ficha, o está con otro formato. Editá la ficha del socio.                                                                                                     |
| Error 63015                               | Esa persona no hizo el `join` del sandbox.                                                                                                                                                     |

## Límites del sandbox de Twilio

- Sólo habla con quienes hicieron el `join`, y esa unión **vence a los 3 días**.
- Es para pruebas: máximo un mensaje cada 3 segundos y **100 mensajes de prueba**
  gratuitos en la cuenta de prueba.
- Para uso real en un club hace falta un remitente de WhatsApp propio aprobado por Meta
  (con Twilio, Kapso u otro proveedor). La lógica del bot se reutiliza tal cual.
