# Recordatorios por WhatsApp con Kapso

Desde **Socios**, el botón de WhatsApp de un socio que adeuda manda el recordatorio
de cuota **desde el número del club**, sin abrir WhatsApp ni apretar "enviar".
Función incluida en el **Plan 250 y superiores**.

```
Botón (app) ─► Edge Function enviar-recordatorio ─► API de Kapso ─► WhatsApp del socio
                 · valida rol, plan, celular y 24 hs
                 · guarda el envío en recordatorios_whatsapp
```

La clave de Kapso vive **sólo** como secreto del servidor: nunca va en el código
ni en el navegador.

## Reglas (las aplica el servidor)

- Sólo el superadmin / tesorería del club del socio.
- El plan del club tiene que incluir recordatorios.
- El socio tiene que adeudar la cuota y tener un celular argentino válido
  (acepta `54 9 11 5555-1201`, `11 5555-1201`, `011 15 5555-1201`, etc.).
- Máximo **un recordatorio por socio cada 24 horas**.
- Si Kapso todavía no está configurado (o en modo demo), el botón abre WhatsApp
  con el mensaje armado para enviarlo a mano, como antes.

## Puesta en marcha

### 1. En Kapso

1. Creá la cuenta y el proyecto en https://app.kapso.ai.
2. **WhatsApp → Phone numbers**: conectá el número del club (o usá el número de
   prueba/sandbox para la demo). Copiá su **Phone number ID**.
3. **Integrations → API keys**: creá una API key y copiala.
4. **WhatsApp → Templates → Create template**, categoría **Utility**, idioma
   **Spanish (Argentina) `es_AR`**, nombre `recordatorio_cuota`, con este cuerpo
   (variables **numeradas**, no con nombre):

   ```
   Hola {{1}} 👋, te escribimos desde {{2}}. Tu cuota social de {{3}} figura como pendiente. Podés ponerte al día desde la app NODO o respondiendo este mensaje. ¡Gracias!
   ```

   Ejemplos para Meta: `{{1}}` = Julieta, `{{2}}` = Club La Unión, `{{3}}` = $ 18.000.
   Enviala a revisión: la aprobación tarda desde minutos hasta ~24 hs. Hasta que
   esté **APPROVED** Kapso rechaza el envío.

### 2. En Supabase (proyecto de la app)

1. Corré `supabase/migrations/0017_recordatorios_whatsapp.sql` en el SQL Editor.
2. Cargá los secretos (Edge Functions → Secrets, o por terminal):

   ```bash
   npx supabase secrets set KAPSO_API_KEY=<tu-api-key> KAPSO_PHONE_NUMBER_ID=<phone-number-id> --project-ref qhbvcpkogbrfnbwqyubv
   ```

   Opcionales: `KAPSO_TEMPLATE_NAME` (default `recordatorio_cuota`) y
   `KAPSO_TEMPLATE_LANG` (default `es_AR`).

3. Desplegá la función:

   ```bash
   npx supabase functions deploy enviar-recordatorio --project-ref qhbvcpkogbrfnbwqyubv --use-api
   ```

### 3. Probar

Entrá como admin de un club con Plan 250+, abrí **Socios**, elegí un socio que
adeude y tenga celular, y tocá el ícono verde de WhatsApp. Tiene que aparecer
"Recordatorio enviado" y llegar el mensaje. Cada envío queda en la tabla
`recordatorios_whatsapp` (estado `enviado` o `error` con el detalle de Kapso).

## Errores frecuentes

| Mensaje en la app                          | Causa                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| "WhatsApp no aceptó el mensaje"            | Plantilla sin aprobar o con otro nombre/idioma, número no conectado, o clave inválida. Mirá `detalle` en `recordatorios_whatsapp`. |
| "El socio no tiene un celular válido"      | Falta el celular o no es argentino/está incompleto.                                                                                |
| "Ya le mandaste un recordatorio… 24 horas" | Límite anti-spam por socio.                                                                                                        |
| "…son del Plan 250 o superior"             | El club está en Gratis o Plan 100.                                                                                                 |

## Límites a tener en cuenta

- Los mensajes que inicia el club se mandan con **plantilla aprobada** (por eso no
  se puede mandar texto libre). Meta cobra por conversación según el tipo.
- Kapso limita las llamadas por minuto según el plan (Free: 100/min).
- Sólo celulares argentinos: se normalizan al formato `549…`.
