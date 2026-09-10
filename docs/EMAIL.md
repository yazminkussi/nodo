# Emails de NODO

NODO manda dos tipos de email:

| Tipo                                                            | Quién lo manda                    | Cómo se configura                   |
| --------------------------------------------------------------- | --------------------------------- | ----------------------------------- |
| **Auth**: confirmar cuenta, enlace mágico, recuperar contraseña | Supabase Auth (solo)              | SMTP propio en el panel de Supabase |
| **Invitación de administrador**                                 | Edge Function `enviar-invitacion` | secreto `RESEND_API_KEY` + deploy   |

Sin configurar nada, la app **funciona igual**: Supabase manda los emails de auth
con su remitente compartido (limitado a ~4 por hora) y las invitaciones se crean
pero no se envían por mail — el admin le avisa al invitado por otro medio.

## 0. Cuenta de Resend (para los dos)

[resend.com](https://resend.com) → registrate (gratis, 3.000 emails/mes).

- **Sin dominio propio**: podés mandar desde `onboarding@resend.dev`, pero **solo
  a tu propia dirección**. Sirve para probar.
- **Con dominio** (cuando NODO tenga uno, Fase 7): _Domains → Add Domain_, cargás
  3 registros DNS y podés mandar a cualquiera desde `hola@tudominio`.

_Settings → API Keys → Create API Key_ → guardala, la vas a usar en los dos pasos.

## 1. Emails de auth (SMTP propio)

Panel de Supabase → **Authentication → Emails → SMTP Settings** (o
_Project Settings → Auth_) → **Enable Custom SMTP**:

| Campo        | Valor                                                |
| ------------ | ---------------------------------------------------- |
| Host         | `smtp.resend.com`                                    |
| Port         | `465`                                                |
| Username     | `resend`                                             |
| Password     | tu `RESEND_API_KEY`                                  |
| Sender email | `onboarding@resend.dev` (o `no-responder@tudominio`) |
| Sender name  | `NODO`                                               |

Después, en **Authentication → Emails → Templates**, poné el texto en español.
Ejemplos (podés ajustarlos):

**Confirm signup**

```
Asunto: Confirmá tu cuenta en NODO
Cuerpo:
¡Hola! Tocá el botón para activar tu cuenta.
<a href="{{ .ConfirmationURL }}">Confirmar mi cuenta</a>
Si no fuiste vos, ignorá este mensaje.
```

**Magic Link**

```
Asunto: Tu enlace de acceso a NODO
Cuerpo:
Entrá a NODO sin contraseña con este enlace (vence en 1 hora):
<a href="{{ .ConfirmationURL }}">Ingresar a NODO</a>
```

**Reset Password**

```
Asunto: Restablecer tu contraseña de NODO
Cuerpo:
Pediste cambiar tu contraseña. Tocá acá para elegir una nueva:
<a href="{{ .ConfirmationURL }}">Cambiar contraseña</a>
Si no fuiste vos, no hace falta que hagas nada.
```

En **Authentication → URL Configuration** poné como _Site URL_ la de producción
(`https://nodo-yazminkussi-8286s-projects.vercel.app`) para que los enlaces
apunten bien.

## 2. Email de invitación (Edge Function)

### Secreto

Panel → **Edge Functions → Secrets** → agregá:

| Name              | Value                                             |
| ----------------- | ------------------------------------------------- |
| `RESEND_API_KEY`  | tu API key de Resend                              |
| `NODO_APP_URL`    | (opcional) URL de la app; default la de Vercel    |
| `NODO_EMAIL_FROM` | (opcional) default `NODO <onboarding@resend.dev>` |

### Deploy

Panel → **Edge Functions → Deploy a new function** → nombre `enviar-invitacion`
→ pegar el contenido de
[`supabase/functions/enviar-invitacion/index.ts`](../supabase/functions/enviar-invitacion/index.ts)
→ Deploy.

### Probar

Vista Admin → **Equipo** → _Invitar administrador_. Si el email está configurado,
el toast dice "Le enviamos un email a…". Si no, dice "Invitación creada. Avisale
a…". El botón ✉️ de cada invitación pendiente reenvía.

> Mientras no tengas dominio verificado en Resend, el email de invitación solo
> llega si el destinatario **sos vos** (tu propia dirección). Para el resto, la
> invitación igual queda creada y se activa cuando esa persona se registra con
> ese email.
