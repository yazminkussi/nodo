# Seguridad del carnet QR

> Nota técnica · Fase 3 de la hoja de ruta.

El carnet digital de cada socio muestra un QR dinámico. Al escanearlo en la
puerta, el club decide si deja entrar (cuota al día, reserva, etc.). Este
documento describe la amenaza y cómo se mitiga.

## Formato del QR

```
NODO|v1|<data-base64url>|<firma>
data = { memberId, communityId, qrToken, ts }   (JSON)
firma = HMAC-SHA256(data-base64url, SECRETO)
```

- `ts` marca cuándo se generó → un código vale **15 minutos** (TTL).
- `qrToken` es un nonce aleatorio por generación.
- La firma autentica el contenido: sin el secreto no se puede producir una
  firma válida.

## La amenaza

**Antes**, el secreto (`nodo-carnet-dinamico-2026`) estaba en
`src/utils/qrPayload.js`, es decir **en el bundle que descarga cualquiera**.

Con ese secreto un tercero podía:

1. Fabricar un QR con el `memberId` de otro socio (o uno inventado) y una firma
   válida → hacerse pasar por un socio al día.
2. Alterar `communityId` para probar contra otras instituciones.

La rotación del `ts` y el `qrToken` no ayudan: el atacante también los firma.

## La mitigación

La firma y la verificación pasan al **servidor** (Supabase Edge Functions). El
secreto ahora es la variable de entorno `CARNET_SECRET`, que **nunca sale de
Supabase**.

| Función            | Quién la llama        | Qué hace                                                                                                                                      |
| ------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `carnet-token`     | el socio (su carnet)  | Verifica el JWT, busca la ficha del socio de esa cuenta y devuelve un payload **firmado**.                                                    |
| `verificar-carnet` | el admin (el escáner) | Verifica firma + TTL + comunidad, controla cuota y reserva contra la base, registra el ingreso en `registros_acceso` y devuelve el resultado. |

Propiedades:

- **El cliente ya no puede firmar.** `src/utils/qrPayload.js` conserva el
  algoritmo sólo para el **modo demo** (sin backend real no hay datos que
  falsificar). Con sesión real, `DigitalCard` pide el token a `carnet-token` y
  el panel de acceso valida con `verificar-carnet`.
- **Verificación server-side del ingreso.** El estado de cuota y la reserva se
  leen en la función con la _service role_, no en el navegador del operador.
- **Comparación de firma en tiempo constante** (`igualdadSegura`) para no filtrar
  información por _timing_.
- **Autorización por rol.** `verificar-carnet` exige que quien llama tenga
  membresía `superadmin` / `deportes` / `talleres` en esa comunidad.
- **TTL de 15 min** limita la ventana de reproducción de un QR filtrado
  (fotografiado, reenviado).

### Qué queda fuera de alcance (por ahora)

- **Nonce de un solo uso.** El `qrToken` viaja pero no se invalida tras el
  primer escaneo: dentro de la ventana de 15 min el mismo QR entra dos veces.
  Mitigación futura: tabla `qr_usados(qr_token, usado_en)` y rechazo si ya
  figura.
- **Rate limiting** explícito sobre `verificar-carnet`.
- El `CARNET_SECRET` es único global; una rotación obliga a que todos los
  carnets vigentes se regeneren (aceptable con TTL de 15 min).

## Deploy (una vez)

Las funciones son **archivos únicos** a propósito, para pegarlos en el editor
web sin tocar la CLI.

### 1. Crear el secreto

Panel de Supabase → **Project Settings → Edge Functions → Secrets** (o
**Edge Functions → Manage secrets**) → **Add new secret**:

| Name            | Value                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `CARNET_SECRET` | una frase larga y aleatoria (≥ 32 caracteres). Podés generar una en cualquier gestor de contraseñas. **No la compartas ni la subas al repo.** |

### 2. Crear las dos funciones

Panel → **Edge Functions** → **Deploy a new function** (vía editor):

- Nombre `carnet-token` → pegar el contenido de
  [`supabase/functions/carnet-token/index.ts`](../supabase/functions/carnet-token/index.ts) → Deploy.
- Nombre `verificar-carnet` → pegar el contenido de
  [`supabase/functions/verificar-carnet/index.ts`](../supabase/functions/verificar-carnet/index.ts) → Deploy.

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya los inyecta
Supabase; no hay que configurarlos.

### 3. Probar

- Entrá al carnet como socio: el QR debería seguir apareciendo ("Generando tu
  QR…" y después el código). Si dice error, revisá que `CARNET_SECRET` exista.
- En Vista Admin → **Escanear**: escaneá el carnet de un socio. El resultado
  (permitido / adeuda) y el registro de ingreso vienen de la función.

Mientras las funciones no estén deployadas, el carnet real no genera QR y el
escáner tira error — el **modo demo sigue funcionando** igual que antes.
