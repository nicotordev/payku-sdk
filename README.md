<p align="center">
  <img src="./public/logo-nicotordev-payku.png" alt="@nicotordev/payku" width="480" />
</p>

# Payku — Cliente API para TypeScript

[![npm](https://img.shields.io/npm/v/@nicotordev/payku.svg)](https://www.npmjs.com/package/@nicotordev/payku)
[![CI](https://github.com/nicotordev/payku-sdk/actions/workflows/verify-build.yml/badge.svg)](https://github.com/nicotordev/payku-sdk/actions/workflows/verify-build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-fbf0df?logo=bun&logoColor=000)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

SDK en TypeScript de código abierto para integrar [Payku](https://payku.com/about), la pasarela de pagos LATAM (Chile, Perú y Venezuela).

## Instalación

```bash
bun add @nicotordev/payku
```

## Configuración

### Por país (recomendado)

Fija la moneda y expone solo los módulos soportados por ese mercado:

```typescript
import Payku from "@nicotordev/payku";

const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "production",
  defaults: {
    urlreturn: "https://tu-sitio.com/return",
    urlnotify: "https://tu-sitio.com/notify",
  },
});

// currency implícita: CLP — y urlreturn/urlnotify opcionales si usas defaults:
await payku.transactions.create({
  amount: 1000,
  payment: "webpay",
  order: "orden-001",
  email: "cliente@example.com",
  subject: "Compra test",
});

// También desde .env (incluye PAYKU_DEFAULT_URLRETURN y PAYKU_DEFAULT_URLNOTIFY opcionales)
const fromEnv = Payku.fromEnvForCountry("CL");
```

| País | Cliente          | Moneda | Extra                                                             |
| ---- | ---------------- | ------ | ----------------------------------------------------------------- |
| `CL` | `PaykuChile`     | CLP    | suscripciones, marketplace, mall, escrow, withdraw, conciliación… |
| `PE` | `PaykuPeru`      | PEN    | core compartido                                                   |
| `VE` | `PaykuVenezuela` | VES    | `transactions.confirmOnSite`                                      |

Si llamás un módulo no soportado (p. ej. `wallet.withdraw` en Perú), el SDK lanza `PaykuUnsupportedFeatureError`. `payku.isSupported("mall")` responde si el país incluye ese módulo, sin lanzar. `payku.sign(path, params)` firma con el token privado ya configurado.

> **💡 Principio de diseño de la API:** La instancia del cliente (`payku` o `Payku.forCountry(...)`) expone todos los métodos de negocio, verificaciones, firmas y parseos a través de sus namespaces (`payku.transactions`, `payku.wallet`, `payku.webhooks`, etc.). No necesitas realizar importaciones manuales de funciones utilitarias independientes a menos que las requieras para un uso específico fuera del cliente.

### Modo global (multi-país)

```typescript
import Payku from "@nicotordev/payku";

const payku = new Payku(
  process.env.PAYKU_PUBLIC_TOKEN!,
  process.env.PAYKU_PRIVATE_TOKEN!,
  "production",
);

// o desde variables de entorno (Bun carga .env automáticamente)
const paykuFromEnv = Payku.fromEnv();
```

En modo global pasás `currency` en cada request (`CLP` | `PEN` | `VES`).

## Autenticación y firma

### Bearer (token público)

Casi todas las requests llevan:

```http
Authorization: Bearer TOKEN_PUBLICO
```

El SDK lo inyecta automáticamente con `publicToken` (constructor, `forCountry` o `.env`).

### Sign (HMAC-SHA256)

Endpoints sensibles envían además el header `Sign`, calculado con el **token privado** (misma lógica que `buildSign` / `HttpClient`):

1. `encodeURIComponent("/api/...")` del path
2. Parámetros a firmar:
   - **GET** → query
   - **POST / PUT / DELETE** → body (si no hay body, solo el path)
3. Keys ordenadas alfabéticamente; se omiten `null`/`undefined` y **objetos/arrays**
4. Cada key/valor se serializa vía `URLSearchParams` (percent-encoding, p. ej. espacios → `+`, `@` → `%40`)
5. Concatenar `pathCodificado&key=value&...` (o solo el path si no hay params)
6. `HMAC-SHA256(concat, privateToken)` en hex

El SDK firma automáticamente las peticiones donde corresponde (`signed: true`). En cualquier instancia del cliente, `payku.sign(path, params)` calcula el header de firma usando el token privado ya configurado en la instancia:

```typescript
import Payku from "@nicotordev/payku";

const payku = Payku.fromEnv();
const sign = payku.sign("/api/suclient", {
  email: "johndoe@example.com",
  name: "John Doe",
  phone: "923122312",
  address: "Moneda 101",
  country: "Chile",
  region: "Metropolitana",
  city: "Santiago",
  postal_code: "850000",
});

// Header generado: Sign: <sign>
```

> **Importación manual (Opcional):** Si prefieres firmar manualmente sin usar una instancia configurada, también puedes usar `Payku.sign(path, params, privateToken)` o importar la función utilitaria `import { buildSign } from "@nicotordev/payku"`.

### Matriz Sign por módulo (SDK)

| Módulo                                       | Sign    | Notas                                                                                       |
| -------------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `transactions`                               | No      | create/get/list/listAll/iterate (y On-Site VE)                                              |
| `banks` / `paymentMethods`                   | No      | Catálogo                                                                                    |
| `conciliation`                               | No      |                                                                                             |
| `escrow` / `events`                          | No      |                                                                                             |
| `wallet`                                     | Sí      | payout, withdraw, balance, movements, get payout                                            |
| `subscriptions` / `consumptionSubscriptions` | Sí      | CRUD clientes, planes, tarjetas, txs                                                        |
| `nullification`                              | Sí      | create y get (GET también: docs omiten Sign, sandbox responde `waiting sign`)               |
| `mall`                                       | Parcial | create sí; get no (sandbox: sin Sign; docs PHP/JS muestran Sign opcional)                   |
| `marketplace`                                | Parcial | Solo `maclient` update (`PUT`); create/delete/get y `maaffiliation` / tx sin Sign (sandbox) |

Referencia oficial y colección Postman: [docs.payku.com](https://docs.payku.com/) · [colección CL](https://docs.payku.com/postman/payku-cl-es.postman_collection.json) · [environment](https://docs.payku.com/postman/payku-environment.postman_environment.json).

## Sandbox Chile

`environment: "sandbox"` usa `https://des.payku.cl` (producción: `https://app.payku.cl`). Las URLs ya están en [`.env.example`](./.env.example).

### Tarjetas de prueba (Webpay)

Valores publicados por Payku para `des.payku.cl`. Cualquier fecha de expiración futura; CVV `123` (AMEX `1234`).

| Tipo | PAN | Resultado |
| --- | --- | --- |
| VISA | `4051 8856 0044 6623` | aprobada |
| AMEX | `3700 0000 0002 032` | aprobada |
| MASTERCARD | `5186 0595 5959 0568` | rechazada |
| Redcompra | `4051 8842 3993 7763` | aprobada (débito / prepago) |
| Redcompra | `5186 0085 4123 3829` | rechazada (débito / prepago) |
| Prepago VISA | `4051 8860 0005 6590` | aprobada |
| Prepago MASTERCARD | `5186 1741 1062 9480` | rechazada |

### Autenticación del formulario Webpay

Cuando Payku pide RUT y clave: RUT `11.111.111-1`, clave `123`.

Montos de payout en sandbox: ver [Wallet → Ambiente Sandbox](#ambiente-sandbox-despaykucl). Docs Payku: [introducción / tarjetas de prueba](https://docs.payku.com/).

## Transacciones

```typescript
// Con forCountry("CL") — currency ya fijada
const order = await payku.transactions.create({
  email: "cliente@example.com",
  order: "orden-001",
  subject: "Compra test",
  amount: 1000,
  payment: "webpay",
  urlreturn: "https://tu-sitio.com/return",
  urlnotify: "https://tu-sitio.com/notify",
});

// Redirigir al pagador
console.log(order.url);
```

`expired` es opcional (`YYYY-MM-DD HH:mm:ss`, hora Santiago). Si se envía, el SDK exige `urlreturn` y que la fecha sea **más de 5 minutos** después de ahora (`America/Santiago`, vía `Intl`). Si la transacción expira, Payku redirige a `urlreturn?message_error=expired&id=…`.

### Listar todas las transacciones

`list()` devuelve una sola página (`page`, `per_page`, máximo 4000). `listAll()` recorre las páginas y devuelve el arreglo completo. `iterate()` es un generador asíncrono: pide la página siguiente solo cuando se consumen los ítems de la actual.

Si omites `per_page`, cada request usa 4000 (`PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE`). La paginación termina cuando una página viene vacía o trae menos registros que `per_page`. `page` es la página inicial (por defecto `1`). Los mismos métodos están en `Payku.forCountry(...)`.

Si omites `date_init` o `date_end`, Payku usa la fecha actual. `listAll()` e `iterate()` fijan ese día una sola vez, en `America/Santiago` (`YYYY-MM-DD`), y lo reenvían en cada página. Sin un rango explícito solo cubren el día de hoy, no el historial. Para transacciones anteriores indica `date_init` y `date_end`.

```typescript
const transactions = await payku.transactions.listAll({
  date_init: "2026-01-01",
  date_end: "2026-01-31",
});

for await (const tx of payku.transactions.iterate({
  date_init: "2026-01-01",
})) {
  console.log(tx.id);
}
```

### Retorno de pasarela (`urlreturn`) y expiración

El cliente de transacciones de la instancia `payku` ofrece métodos integrados para procesar y validar el retorno del pagador en la `urlreturn`.

#### Reconsulta completa y estado de negocio (`handleReturn`) — Recomendado

Procesa la URL o query devuelta por Payku, reconsulta la API para verificar el estado real y retorna flags de estado (`isPaid`, `isPending`, `isFailed`, `isExpired`):

```typescript
// Acepta URL completa, query string, URLSearchParams o un objeto query (Next.js / Express)
const result = await payku.transactions.handleReturn(req.query);

if (result.isExpired) {
  console.log(`La transacción ${result.id} ha expirado.`);
} else if (result.isPaid) {
  console.log(`Transacción ${result.id} pagada exitosamente.`);
} else if (result.isPending) {
  console.log(`Transacción ${result.id} en proceso de pago.`);
}
```

#### Parseo local de query (`parseReturnQuery`)

Si deseas analizar únicamente la query devuelta sin realizar llamadas HTTP adicionales:

```typescript
const parsed = payku.transactions.parseReturnQuery(req.query);

if (parsed.expired) {
  console.log(`Transacción ${parsed.id} expiró según la pasarela.`);
} else {
  console.log(`Transacción id: ${parsed.id}, status: ${parsed.status}`);
}
```

> **Importación manual (Opcional):** Las funciones standalone como `parseReturnQuery` o `isTransactionPaid` también están disponibles como exportaciones directas (`import { parseReturnQuery } from "@nicotordev/payku"`), aunque su uso manual no es necesario ya que la instancia `payku.transactions` incluye todo integrado.

## Catálogo

### Bancos (`banks`)

Permite consultar las instituciones financieras disponibles por moneda. El endpoint `GET /api/banks` es de acceso público (no requiere Bearer ni firma HMAC `Sign`).

#### Con cliente por país (recomendado)

Al usar `Payku.fromEnvForCountry("CL" | "PE" | "VE")` (o `Payku.forCountry("CL", config)`), la moneda se infiere automáticamente:

```typescript
import Payku from "@nicotordev/payku";

const payku = Payku.fromEnvForCountry("CL");

// Consulta automáticamente con currency="clp"
const banks = await payku.banks.list();

for (const bank of banks) {
  console.log(`${bank.code}: ${bank.name} (${bank.currency})`);
}
```

#### Con cliente global

```typescript
const payku = Payku.fromEnv();
const banks = await payku.banks.list({ currency: "clp" }); // "clp" | "pen" | "ves"
```

#### Uso del código SBIF (`PaykuBank.code`)

En Chile, el valor de `bank.code` corresponde al código oficial SBIF de la institución (ej. `"0001"` para Banco de Chile, `"0012"` para Banco Estado). Se utiliza en dos flujos esenciales:

1. **Payout de Wallet:** al solicitar una liquidación o transferencia bancaria (`payku.wallet.payout.create`), se debe especificar el código SBIF en el campo `accountbank_sbif`.
   > **Nota:** Para transferencias a Banco Estado (incluyendo CuentaRUT), el código SBIF es `"0012"`.

2. **Transacciones directas (Chile):** al crear una transacción (`payku.transactions.create`) utilizando pasarelas de transferencia bancaria directa (Etpay, Fintoc o Floid), puedes preseleccionar el banco del pagador mediante `additional_parameters: { payer_bank: bank.code }`.

### Métodos de Pago (`paymentMethods`)

Permite consultar los medios de pago disponibles. El endpoint `GET /api/paymentmethods` es de acceso público (no requiere Bearer ni firma HMAC `Sign`).

#### Con cliente por país (recomendado)

```typescript
const payku = Payku.fromEnvForCountry("CL");

// Infiere automáticamente currency="clp"
const methods = await payku.paymentMethods.list();

for (const method of methods) {
  console.log(`${method.payment}: ${method.name} (${method.currency})`);
}

payku.paymentMethods.toSlug(1); // "webpay"
payku.paymentMethods.resolve("webpay"); // 1
```

#### Con cliente global

```typescript
const payku = Payku.fromEnv();
// Filtrar por moneda
const clpMethods = await payku.paymentMethods.list({ currency: "clp" });
// O consultar todos los medios disponibles sin filtro
const allMethods = await payku.paymentMethods.list();

payku.paymentMethods.toSlug(1, "CLP"); // "webpay"
payku.paymentMethods.resolve("safety_pay"); // 20
```

#### Uso en creación de transacciones (`transactions.create`)

Cada método de pago incluye un identificador numérico `payment` (ej. `1` para Webpay Plus, `4` para ETpay, `9` para MACH). En `transactions.create` puedes pasar ese código **o** el slug (`"webpay"`, `"etpay"`, `"fintoc"`, `"safety_pay"`, `"vepuy"`, …); el SDK lo resuelve al número antes de firmar y enviar. `payment: 1` sigue válido.

```typescript
import Payku from "@nicotordev/payku";

const payku = Payku.fromEnvForCountry("CL");

// 1. Obtener medios de pago disponibles para la cuenta
const methods = await payku.paymentMethods.list();
const webpay = methods.find((m) => m.payment === 1);

if (!webpay) {
  throw new Error("Webpay Plus no está habilitado para esta cuenta.");
}

// 2. Iniciar transacción fijando el medio de pago verificado
const order = await payku.transactions.create({
  amount: 15000,
  payment: webpay.payment, // 1 (Webpay Plus)
  order: "orden-001",
  email: "cliente@example.com",
  subject: "Compra en línea",
  urlreturn: "https://tu-sitio.com/return",
  urlnotify: "https://tu-sitio.com/notify",
});
```

> **Nota:** Los medios de pago devueltos por la API dependen de los convenios y pasarelas efectivamente activadas para la cuenta comercial en Payku.

## Webhooks

```typescript
const result = await payku.webhooks.verifyNotify(payload, {
  expectedOrder: "orden-001",
  expectedAmount: 1000,
});

if (result.valid) {
  // Pago verificado contra la API de Payku
}
```

En un Route Handler puedes pasar el `Request` (o el JSON ya parseado). La respuesta HTTP la arma el framework:

```typescript
export async function POST(req: Request) {
  const result = await payku.webhooks.handleRequest(req);

  if (!result.valid) {
    return Response.json({ error: result.reason }, { status: 400 });
  }

  await markOrderPaid(result.transaction.order);
  return Response.json({ received: true });
}
```

`handleRequest` acepta un `Request` o el payload ya parseado; por dentro usa `verifyNotify`.

Payku usa nombres distintos para el mismo rechazo:

| Origen                         | Valores                                              |
| ------------------------------ | ---------------------------------------------------- |
| Payload `urlnotify`            | `success` \| `failed`                                |
| `GET /api/transaction` (API)   | `register` \| `pending` \| `success` \| `rejected`   |

`verifyNotify` reconsulta la API. Si no pasas `expectedStatus`, deriva el esperado del `payload.status` (`failed` → `rejected`). También puedes usar `mapNotifyStatusToTransactionStatus`. Si `payload.verification_key` y `transaction.payment.verification_key` tienen valor, deben coincidir; si no, el resultado es `{ valid: false, reason: "verification_key_mismatch" }`.

Mall no usa `GET /transaction/{payment_key}`: los ids son `mall…`. Confirma el callback con `payku.mall.verifyNotify(payload)`, que reconsulta `GET /api/mall/{id}` y valida status, monto y `verification_key` si vienen.

```typescript
const mallResult = await payku.mall.verifyNotify(payload, {
  expectedAmount: 30000,
});

if (!mallResult.valid) {
  console.warn("Notify Mall inválido:", mallResult.reason);
}
```

Las suscripciones de Chile tienen **dos** callbacks propios, distintos del `urlnotify` de transacciones:

| Callback | Payload | Verificación |
| --- | --- | --- |
| `urlnotifysuscription` | `{ id: "su…", status }` | `payku.subscriptions.verifyActivationNotify` → `GET /api/sususcription/{id}` |
| `urlnotifypayment` | `{ transaction_id, verification_key, order, status, subscriptions: { id, client } }` | `payku.subscriptions.verifyPaymentNotify` → `GET /api/sususcription/{id}` y el cobro anidado |

```typescript
const activation = await payku.subscriptions.verifyActivationNotify({
  id: "su74866857980c7d2b4306",
  status: "active",
});

const payment = await payku.subscriptions.verifyPaymentNotify({
  transaction_id: 9123123,
  verification_key: "2ba83615f863e72sdca5dfd0a6df2782",
  order: "1568041684",
  status: "success",
  subscriptions: {
    id: "su3ce571420e90b600eafb",
    client: "cl795704ece0a3690baaf",
  },
});
```

## Errores y respuestas

Según la [introducción de la API Payku](https://docs.payku.com/), **no confíes solo en el código HTTP** (p. ej. 200). Muchas respuestas de error llegan con HTTP 200 y un JSON de negocio:

| `status` en el JSON                      | Significado                                |
| ---------------------------------------- | ------------------------------------------ |
| `"success"` / `"pending"` / `"register"` | Flujo OK (según endpoint)                  |
| `"failed"`                               | Error de negocio (`type`, `message_error`) |

Este SDK ya inspecciona el body en `HttpClient`: si `status === "failed"` (o `type === "Unauthorized"`), lanza un error tipado en lugar de devolver el JSON.

### try / catch con el SDK

```typescript
import Payku, { PaykuAPIError } from "@nicotordev/payku";

const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "sandbox",
});

try {
  await payku.transactions.create({
    amount: 1000,
    payment: 1,
    order: "orden-001",
    email: "cliente@example.com",
    subject: "Compra test",
  });
} catch (error) {
  if (error instanceof PaykuAPIError) {
    console.error(error.message, error.statusCode, error.type);
    console.error(error.response); // JSON original de Payku
    return;
  }

  // Comprobar si cualquier error proviene del SDK mediante la clase Payku:
  if (Payku.isError(error)) {
    console.error(error.message, error.statusCode, error.type);
    return;
  }

  throw error;
}
```

> **Importación manual (Opcional):** Si no usas la clase `Payku`, las utilidades como `isPaykuError`, `isPaykuFailedResponse` y `extractPaykuErrorMessage` también pueden importarse manualmente (`import { isPaykuError } from "@nicotordev/payku"`).

### Inspeccionar JSON crudo

Si lees respuestas API fuera del cliente (proxy, log), las utilidades públicas te permiten inspeccionar respuestas JSON crudas:

```typescript
import {
  extractPaykuErrorMessage,
  isPaykuFailedResponse,
  isPaykuUnauthorizedResponse,
} from "@nicotordev/payku";

function handleRawPaykuJson(data: unknown) {
  if (isPaykuFailedResponse(data)) {
    console.error(extractPaykuErrorMessage(data), data.type);
    return;
  }

  if (isPaykuUnauthorizedResponse(data)) {
    console.error(extractPaykuErrorMessage(data));
  }
}
```

> **Nota:** el payload de `urlnotify` es manipulable. Para decidir si un pago es válido usa `payku.webhooks.verifyNotify()`, que reconsulta la API.

## Wallet (Billetera Virtual)

Permite operar con los fondos de tu billetera virtual Payku para consultar saldo, movimientos, realizar retiros a la cuenta bancaria del comercio y pagos a terceros (payouts).

Para más detalles, consulta la [documentación oficial de Payku Wallet](https://docs.payku.cl/docs/wallet).

### Disponibilidad por país

| Operación | Chile (`CL`) | Perú (`PE`) | Venezuela (`VE`) |
| --- | :---: | :---: | :---: |
| `wallet.balance.get()` | ✓ | ✓ | ✓ |
| `wallet.movements.list()` / `get()` | ✓ | ✓ | ✓ |
| `wallet.payouts.create()` / `get()` / `getV3()` | ✓ | ✓ | ✓ |
| `wallet.payouts.verifyNotify()` | ✓ | ✓ | ✓ |
| `wallet.withdraw.create()` | ✓ | ✗ (`PaykuUnsupportedFeatureError`) | ✗ (`PaykuUnsupportedFeatureError`) |

```typescript
import Payku from "@nicotordev/payku";

const cl = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "sandbox",
});

// 1. Consultar saldo disponible
const balance = await cl.wallet.balance.get();
console.log(`Saldo disponible: ${balance.amount_available} ${balance.currency}`);

// 2. Listar movimientos con paginación
const movements = await cl.wallet.movements.list({ page: 1, per_page: 20 });

// 3. Pago a terceros (Payout)
const payout = await cl.wallet.payouts.create({
  email: "destinatario@example.com",
  subject: "Pago por servicios",
  currency: "CLP",
  order: "payout-001",
  amount: 25000,
  bank: {
    name: "Juan Pérez",
    rut: "111111111",
    sbif: "0001",
    type: "checking", // "checking" | "view" | "savings", o "1" | "2" | "3"
    num: "123456789",
  },
  url_notify: "https://tu-sitio.com/api/payout-notify",
  order_ext: "ext-ref-456", // Opcional
});

// 4. Retiro a la cuenta bancaria del comercio (Solo Chile)
const withdraw = await cl.wallet.withdraw.create({
  subject: "Retiro a cuenta comercio",
  currency: "CLP",
  order: "withdraw-001",
  amount: 50000,
});

// 5. Consultar estado de un Payout (v1 o v3 con reason_rejection)
const payoutDetail = await cl.wallet.payouts.getV3(payout.identifier_payout);
if (payoutDetail.payout.status === "banking_error") {
  console.error("Rechazado por el banco:", payoutDetail.payout.reason_rejection);
}
```

### Verificación del callback `url_notify` de Payouts

Al realizar pagos a terceros con `url_notify`, Payku enviará una notificación POST cuando el banco confirme o rechace la transferencia.

> **Importante:** El webhook de payouts es diferente al de cobros/transacciones:
> - Para **transacciones/cobros** (`urlnotify`): usa `payku.webhooks.verifyNotify(payload)`.
> - Para **payouts** (`url_notify`): usa `cl.wallet.payouts.verifyNotify(payload, options)`.

```typescript
// En tu endpoint receptor (POST /api/payout-notify)
const notifyPayload = req.body; // PaykuPayoutNotifyPayload

const verification = await cl.wallet.payouts.verifyNotify(notifyPayload, {
  useV3: true,                 // Consulta v3 para obtener reason_rejection si fue rechazado
  expectedOrder: "payout-001", // Valida coincidencia de orden
});

if (!verification.valid) {
  console.warn("Notificación de payout inválida:", verification.reason);
  return res.status(400).send("Invalid notification");
}

// Seguro: datos revalidados contra el servidor de Payku
if (verification.payout.status === "success") {
  console.log("Transferencia completada:", verification.payout.id);
} else {
  console.log("Transferencia fallida:", verification.payout.status);
}
```

### Reglas y validaciones de cuenta bancaria

- **Banco Estado (SBIF `0012`):** El número de cuenta (`accountbank_num`) tiene un máximo de **12 dígitos**. El SDK valida esto automáticamente para evitar que los usuarios ingresen el número de tarjeta de débito (16 dígitos), el cual no es un número de cuenta válido.
- `payouts.create` acepta `bank: { name, rut, sbif, type, num }` o los campos planos `accountbank_*`. El body HTTP sigue siendo `accountbank_*`. Si ambos vienen y no coinciden, el SDK lanza `PaykuError`. `type` acepta `"checking"` / `"view"` / `"savings"` (también `corriente`, `vista`, `rut`, `ahorro`) o `"1"` / `"2"` / `"3"`. Lo mismo vale para `marketplace.clients` `bank.type`.
- Para el resto de los bancos en Chile, los números de cuenta no están estandarizados y pueden tener longitudes variables.

### Ambiente Sandbox (`des.payku.cl`)

En el ambiente de desarrollo (`sandbox`), Payku procesa los montos de payout de forma predecible para facilitar tus pruebas:

| Montos | Resultado en Sandbox |
| --- | --- |
| `1000`, `2000`, `3000` | Auto-aprobados (`success`) |
| `1500`, `2500`, `3500` | Auto-rechazados (`banking_error`) |

> **Importación manual (Opcional):** Si requieres la constante para validaciones tipadas en pruebas, también puedes importarla directamente: `import { PAYKU_WALLET_SANDBOX_AMOUNTS } from "@nicotordev/payku"`.


## Anulación (Chile)

El módulo de Anulación permite solicitar la reversa o cancelación (total o parcial) de transacciones procesadas a través de `POST /api/nullification` y consultar su estado vía `GET /api/nullification/{id}`.

> [!NOTE]
> - **Alcance:** Exclusivo para Chile (`Payku.forCountry("CL").nullification`). En Perú y Venezuela el cliente no expone este módulo (`PaykuPeru` y `PaykuVenezuela`).
> - **Autenticación y firma:** Tanto `create` como `get` requieren firma HMAC-SHA256 en el header `Sign` (el SDK lo calcula e inyecta automáticamente usando tu `privateToken`). En el ambiente Sandbox, la API rechaza `GET` con `error:waiting sign` si no se envía la firma.
> - **Callback de anulación:** Se configura en el panel de Payku y su formato es distinto al webhook de cobro `urlnotify` de transacciones.

### Crear y consultar anulación

```typescript
import Payku, { PaykuNullificationError } from "@nicotordev/payku";

const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "sandbox", // o "production"
});

try {
  // 1. Solicitar anulación de la transacción
  const created = await payku.nullification.create({
    id: "trxpr2a45s1dytg1",
    amount: 25000,
    subject: "anulación transacción",
  });

  console.log(`Solicitud registrada: ${created.status} | ID: ${created.nullify.id}`);

  // 2. Consultar estado de la anulación
  const detail = await payku.nullification.get(created.nullify.id!);
  console.log(`Estado anulación: ${detail.nullify.status_nullify} | Monto: ${detail.nullify.amount}`);
} catch (error) {
  if (error instanceof PaykuNullificationError) {
    console.error(`Error en anulación (${error.statusCode}):`, error.message);
  }
}
```

### Verificación del callback de anulación (`verifyCallback`)

Payku envía un POST a la URL de callback configurada en tu panel con los datos de la reversa. Para evitar confiar ciegamente en datos externos no firmados, `nullification.verifyCallback` reconsulta directamente la API de Payku:

```typescript
// En tu endpoint de callback (Next.js App Router / Web API):
const callbackPayload = await req.json();

// O en Express:
// const callbackPayload = req.body;

const result = await payku.nullification.verifyCallback(callbackPayload, {
  expectedStatus: "complete", // opcional: exige estado específico
  expectedAmount: 25000,      // opcional: valida que coincida con el monto esperado
});

if (result.valid) {
  console.log(`Anulación verificada exitosamente para ID: ${result.nullify.id}`);
} else {
  console.error(`Fallo en verificación (${result.reason}):`, result.callback);
}
```

### Estados de anulación (`status_nullify`)

Los estados devueltos en `nullify.status_nullify` corresponden al tipo `PaykuNullifyStatus`:

| Estado | Descripción |
| --- | --- |
| `complete` | Anulación procesada y ejecutada exitosamente. |
| `pending` | Anulación en proceso de registro. |
| `awaiting_funds` | En espera de fondos en la próxima liquidación del comercio para procesar la reversa. |
| `waiting_bank_details` | En espera de datos bancarios para efectuar la devolución al cliente. |
| `reverse_completed` | Reversa bancaria completada exitosamente. |
| `reverse_deleted` | Solicitud de reversa o anulación cancelada / eliminada. |

## Escrow (Chile)

El módulo Escrow permite autorizar la liquidación de transacciones en custodia a través del endpoint `POST /api/escrow`.

> [!NOTE]
> - **Alcance:** Exclusivo para Chile (`Payku.forCountry("CL").escrow`). En Perú y Venezuela el cliente no expone este módulo (`PaykuPeru` y `PaykuVenezuela`).
> - **Requisito:** Requiere una cuenta de custodia / escrow previamente habilitada y autorizada por Payku para tu comercio.
> - **Autenticación:** Utiliza autenticación estándar `Bearer` (no requiere firma HMAC `Sign`).

### Autorizar liquidación (`escrow.authorize`)

```typescript
import Payku, { PaykuEscrowError } from "@nicotordev/payku";

const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "sandbox", // o "production"
});

try {
  const result = await payku.escrow.authorize({
    transactions: [
      "trx3b4d77b43acd9a720",
      "trx3b4d77b43acd9a385",
    ],
  });

  for (const item of result.transactions) {
    console.log(
      `ID: ${item.transaction_id} | Estado: ${item.status} | Depósito: ${item.deposit_date}`,
    );
  }
} catch (error) {
  if (error instanceof PaykuEscrowError) {
    console.error(`Error en Escrow (${error.statusCode}):`, error.message);
  }
}
```

### Estados de liquidación (`status`)

Cada transacción autorizada dentro de `result.transactions` retorna uno de los siguientes estados documentados:

| Estado (`status`) | Descripción |
| --- | --- |
| `liquidate` | Transacción autorizada y liquidada. Contiene fechas `availability_date` y `deposit_date`. |
| `pending for deposit` | Transacción autorizada, pendiente de programación bancaria (`deposit_date: "N/D"`). |
| `pending` | Transacción en espera de procesamiento. |
| `paid` | Fondos ya depositados previamente en la cuenta de destino. |
| `not found` | Identificador no encontrado o no asociado a una custodia válida. |

## Marketplace (Chile)

Reparto de un cobro entre el comercio y vendedores (`maclient` → `maaffiliation` → transacción con token de afiliación). Solo `Payku.forCountry("CL")`. Diagrama Payku: [Marketplace](https://docs.payku.com/img/diagrams/Diagrama-Marketplace.png).

> [!NOTE]
> - **Sign:** solo `marketplace.clients.update` (`PUT /api/maclient/{id}`). Create/get/delete de cliente, afiliaciones y la transacción van con Bearer.
> - El campo `marketplace` en el cobro es el **token** de la afiliación (`aff.token`), no el `id` del cliente.

```typescript
import Payku, { PaykuMarketplaceError } from "@nicotordev/payku";

const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "sandbox",
});

try {
  const client = await payku.marketplace.clients.create({
    email: "vendedor@example.com",
    name: "Vendedor Test",
    phone: "923122312",
    bank: {
      sbif: "0001",
      type: "checking", // "checking" | "view" | "savings", o "1" | "2" | "3"
      num: "12312313121",
      rut: "111111111",
    },
  });

  const aff = await payku.marketplace.affiliations.create({
    name: "market1",
    percentage: 20,
    affiliation: [{ clientId: client.id, percentage: 80 }],
  });

  const order = await payku.marketplace.transactions.create({
    email: "comprador@example.com",
    order: "mkt-001",
    subject: "Pedido marketplace",
    amount: 10000,
    payment: 1,
    urlreturn: "https://tu-sitio.com/return",
    urlnotify: "https://tu-sitio.com/notify",
    marketplace: aff.token,
  });

  // Redirect order.url → confirmar con webhooks.verifyNotify / transactions.get
  console.log(order.url);
} catch (error) {
  if (error instanceof PaykuMarketplaceError) {
    console.error(`Marketplace (${error.statusCode}):`, error.message);
  } else {
    throw error;
  }
}
```

`percentage` es el % del comercio; `affiliation` acepta `{ clientId, percentage }` o tuplas `[idCliente, %vendedor]`. El body HTTP sigue siendo `[[id, "80"], ...]`. Deben sumar 100 con el comercio.

## Mall (Chile)

Agrupa varias tiendas en **una** pasarela (`POST /api/mall`). Los ids son `mall…`, no `trx…`. Solo Chile. Diagrama Payku: [Mall](https://docs.payku.com/img/diagrams/Diagrama-Mall.png).

> [!NOTE]
> - **Sign** en `mall.create`. `mall.get` va solo con Bearer (sandbox no exige Sign).
> - Cada fila `merchant` es un objeto `{ tokenOrAffiliationId, amount, subject, eventId, individualOrder }` o la tupla wire de 5 elementos. `eventId` omitido se envía como `null`.
> - El callback `urlnotify` se verifica con `payku.mall.verifyNotify`, no con `webhooks.verifyNotify`. Ver [Webhooks](#webhooks).

```typescript
import Payku, { PaykuMallError } from "@nicotordev/payku";

const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "sandbox",
});

try {
  const mall = await payku.mall.create({
    email: "comprador@example.com",
    payment: 1,
    merchant: [
      {
        tokenOrAffiliationId: "TOKEN_O_AFILIACION",
        amount: 30000,
        subject: "item1",
        eventId: null,
        individualOrder: "4545",
      },
      ["81b6179e4feeef2b50af71d66f7830de", 25000, "item2", null, "4546"],
    ],
    order: 123,
    urlreturn: "https://tu-sitio.com/return",
    urlnotify: "https://tu-sitio.com/notify",
  });

  // Redirect mall.url → confirmar con mall.get(mall.id) o mall.verifyNotify
  const current = await payku.mall.get(mall.id);
  console.log(mall.url, current.status);
} catch (error) {
  if (error instanceof PaykuMallError) {
    console.error(`Mall (${error.statusCode}):`, error.message);
  } else {
    throw error;
  }
}
```

## Suscripciones (Chile)

Planes **recurrentes** (monto fijo o variable). El plan suele existir ya en Payku; el SDK lo consulta, no lo crea. Diagrama Payku: [Suscripción](https://docs.payku.com/img/diagrams/Diagrama-Suscripcion.png).

Cargos únicos / delivery van en [`consumptionSubscriptions`](#suscripción-de-consumo-chile) (#71), no en `subscriptions.transactions.create`.

La API usa typos en el wire (`suscription`, `subcriptions`, `url_notify_suscription`, `update_at`). El SDK replica esas keys.

### Flujo (8 pasos)

1. Crear cliente (`subscriptions.clients.create`).
2. Listar o obtener el plan (`subscriptions.plans.list` / `get`).
3. Crear la suscripción (`subscriptions.subscriptions.create`) → `url` de 3DS.
4. Redirigir al pagador. El **primer** alta cobra **$50 CLP** para validar la tarjeta.
5. Callback de activación `urlnotifysuscription` → `verifyActivationNotify`.
6. En plan fijo, Payku cobra el servicio desde el **mes siguiente**. Cada cobro llega a `urlnotifypayment` → `verifyPaymentNotify`.
7. Consultar o listar (`subscriptions.subscriptions.get` / `list` / `listV3`).
8. Opcional: renovar tarjeta (`subscriptions.cards.register`) o eliminar (`cards.delete`).

```typescript
import Payku from "@nicotordev/payku";

const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "sandbox",
});

const client = await payku.subscriptions.clients.create({
  email: "cliente@example.com",
  name: "Cliente Test",
  phone: "923122312",
});

const { plans } = await payku.subscriptions.plans.list();
const plan = plans[0];

const subscription = await payku.subscriptions.subscriptions.create({
  plan: plan.id,
  client: client.id as string,
  // amount: "15000", // solo planes de monto variable (CLP)
});

console.log(subscription.url); // 3DS / Webpay
```

### Callbacks `urlnotifysuscription` y `urlnotifypayment`

No uses `payku.webhooks.verifyNotify` para estos POST: no son `trx…` ni `mall…`.

1. **Activación** (`url_notify_suscription` → `POST /urlnotifysuscription`): Payku avisa el estado de la suscripción (`register` \| `active` \| `finish` \| `delete` \| `cancel` \| `suspended`). `verifyActivationNotify` reconsulta `GET /api/sususcription/{id}` (con `Sign`) y compara `status`.
2. **Cobro** (`url_notify_payment` → `POST /urlnotifypayment`): Payku avisa un cargo automático. `verifyPaymentNotify` reconsulta la misma GET, busca `transactions[]` por `transaction_id` y valida status, `order` y `verification_key` cuando ambos lados la envían (o `expectedVerificationKey`). Notify `failed` se mapea a API `rejected`.

```typescript
const activation = await payku.subscriptions.verifyActivationNotify(req.body);
if (!activation.valid) {
  console.warn("Notify de activación inválido:", activation.reason);
}

const payment = await payku.subscriptions.verifyPaymentNotify(req.body);
if (payment.valid && payment.transaction.status === "success") {
  // Cobro confirmado contra GET /api/sususcription/{id}
}
```

## Suscripción de consumo (Chile)

Hay **dos** clientes Chile que hablan endpoints parecidos. No son intercambiables: consumo firma paths **con** trailing slash (`/suclient/`, `/suplan/`, …); la suscripción regular usa paths **sin** slash.

| | `payku.subscriptions` | `payku.consumptionSubscriptions` |
| --- | --- | --- |
| Cuándo | Planes recurrentes (el plan suele existir ya en Payku) | Cargos únicos (delivery / producto) |
| `suclient` | CRUD + list | solo `create` |
| `suplan` | `get` / `list` | **`create`** |
| `sususcription` | CRUD + list / listV3 | solo `create` |
| `sutransaction` | `create` | `create` (docs de consumo: `marketplace` / `card`) |
| `cards` | `register` + `delete` | solo `delete` |

Usa `Payku.forCountry("CL").consumptionSubscriptions` cuando el flujo es **plan de consumo → cliente → suscripción → un `sutransaction` por cada cargo**. El CRUD de consulta (get/list, afiliar tarjeta, planes ya creados) sigue en `subscriptions`. Tipos P0 de consumo: [#63](https://github.com/nicotordev/payku-sdk/issues/63), [#64](https://github.com/nicotordev/payku-sdk/issues/64), [#65](https://github.com/nicotordev/payku-sdk/issues/65), [#66](https://github.com/nicotordev/payku-sdk/issues/66), [#67](https://github.com/nicotordev/payku-sdk/issues/67).

Diagrama Payku del cargo: [sutransaction](https://docs.payku.com/img/diagrams/Diagrama-Sutransaction.png).

### Flujo delivery / cargo único

El alta de la suscripción también cobra **$50 CLP** para validar la tarjeta. Cada delivery posterior es un `transactions.create`. El request acepta `subscription`; el body HTTP y el `Sign` siguen usando `suscription`. Opcionales de docs de consumo: `marketplace` (token de afiliación) y `card`.

```typescript
import Payku from "@nicotordev/payku";

const cl = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "sandbox",
});

const plan = await cl.consumptionSubscriptions.plans.create({
  name: "Delivery",
  urlNotifySubscription: "https://tu-sitio.com/notify-suscription",
  url_notify_payment: "https://tu-sitio.com/notify-payment",
});

const client = await cl.consumptionSubscriptions.clients.create({
  email: "cliente@example.com",
  name: "Cliente Test",
  phone: "923122312",
});

const sub = await cl.consumptionSubscriptions.subscriptions.create({
  plan: plan.id,
  client: client.id as string,
});
// redirect sub.url  — o consumptionSubscriptions.gatewayUrl (abajo)

const charge = await cl.consumptionSubscriptions.transactions.create({
  subscription: sub.id, // el body HTTP sigue siendo suscription
  amount: "10000",
  order: "001",
  marketplace: "ma…", // opcional: token de afiliación
  // card: "sure…",  // opcional: tarjeta activa
});
```

Los callbacks `urlnotifysuscription` / `urlnotifypayment` son los mismos que en suscripción regular: verifícalos con `payku.subscriptions.verifyActivationNotify` y `verifyPaymentNotify` ([#59](https://github.com/nicotordev/payku-sdk/issues/59), [sección Callbacks](#callbacks-urlnotifysuscription-y-urlnotifypayment)). Docs Payku: [suscripción de consumo](https://docs.payku.com/).

Para mandar al cliente **directo a Webpay** sin crear la transacción por API, `gatewayUrl` arma `GET {rootUrl}/suscripcion/index` con el host del cliente:

```typescript
const gatewayUrl = cl.consumptionSubscriptions.gatewayUrl({
  planId: 607,
  verif: "b4280f5e",
  firstName: "vicente",
  lastName: "borjas",
  email: "cliente@example.com",
  phone: "986523565",
});
// https://des.payku.cl/suscripcion/index?idplan=607&verif=…&direct_full=true
```

`directFull` default `true`. Query extra en `extra` (no pisa `idplan` / `verif` / datos del cliente).

## Eventos (Chile)

Crear un evento y consultar su detalle:

```typescript
const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "production",
});

const created = await payku.events.create({
  event: "98374",
  name: "Event",
  date_event: "2023-12-20",
  date_closing_sales: "2023-12-19 23:59:00",
  date_payment: "2023-12-22",
  affiliation: [
    { email: "a@x.com", percent: 50 },
    { email: "b@x.com", percent: 50 },
  ],
});

const detail = await payku.events.get(created.id);
```

> **Nota:** La respuesta de `events.create()` usa `affiliation`, mientras que el detalle obtenido con `events.get()` usa `affiliations`.
 
## Conciliación (Chile)

El módulo de conciliación permite consultar depósitos y liquidaciones bancarias realizadas por Payku para una cuenta en un rango de fechas (ver [documentación oficial de Conciliación Payku](https://docs.payku.com/#7e722880-928e-4a47-a8df-a7a5f6a96e95)).

Disponible únicamente para Chile (`PaykuChile` o cliente global con cuenta chilena).

```typescript
import Payku, { PaykuConciliationError } from "@nicotordev/payku";

const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "production",
});

try {
  const result = await payku.conciliation.list({
    date_init: "2024-05-01",
    date_end: "2024-05-15",
  });

  for (const item of result.conciliation) {
    console.log(`Conciliación #${item.id} (${item.status}): $${item.amount_deposit} transferido a ${item.destiny}`);
    for (const trx of item.transaction ?? []) {
      console.log(`  - Trx ${trx.transaction_id} (Orden: ${trx.order}): Monto $${trx.amount}, Comisión $${trx.fee}`);
    }
  }
} catch (error) {
  if (error instanceof PaykuConciliationError) {
    console.error(`Error de conciliación: ${error.message} (HTTP ${error.statusCode})`);
  } else {
    throw error;
  }
}
```

### Reglas y validaciones

- **Método principal:** `payku.conciliation.list(params)`. El método `create()` continúa disponible como alias marcado como `@deprecated` por retrocompatibilidad.
- **Rango de fechas:** Requiere `date_init` y `date_end` en formato `YYYY-MM-DD`.
- **Límite:** El rango entre `date_init` y `date_end` no puede superar **30 días**, y ninguna fecha puede estar en el futuro.
- **Autenticación:** Requiere únicamente autenticación `Bearer` (token público). **No utiliza firma HMAC `Sign`**.
- **Manejo de errores:** Lanza `PaykuConciliationError` ante respuestas de error de la API (401, 500, etc.) y `PaykuError` si la validación de fechas falla antes de enviar la petición.

## Validación con Zod (opcional)

El SDK provee esquemas Zod en `@nicotordev/payku/zod` para validar solicitudes de pago, webhooks y retornos en Next.js, Express, Hono y Server Actions.

`zod` es una dependencia de pares opcional (`peerDependenciesMeta.zod.optional: true`):

```bash
bun add @nicotordev/payku zod@^3.20.0
```

Ejemplo rápido en un Route Handler de Next.js (`POST /api/webhooks/payku`):

```typescript
import { NextResponse } from "next/server";
import Payku from "@nicotordev/payku";
import {
  PaykuTransactionNotifySchema,
  toPaykuNotifyPayload,
} from "@nicotordev/payku/zod";

const payku = Payku.fromEnv();

export async function POST(req: Request) {
  const parsed = PaykuTransactionNotifySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await payku.webhooks.verifyNotify(
    toPaykuNotifyPayload(parsed.data),
  );

  return NextResponse.json({ valid: result.valid });
}
```

Para recetas completas de integración, Server Actions, Hono, Express y buenas prácticas, consulta [`docs/zod.md`](./docs/zod.md).

## Especificación del SDK

Ver [`docs/sdk-spec.md`](./docs/sdk-spec.md) para arquitectura, convenciones y roadmap.

## Referencia API

Generar documentación TypeDoc:

```bash
bun run docs:api
```

La salida queda en [`docs/api/`](./docs/api/).

## Tests

```bash
bun run test             # unit (default)
bun run test:integration # smoke sandbox por módulo (tokens + PAYKU_ENVIRONMENT=sandbox)
```

## Contribuir

Pull requests y issues son bienvenidos. Empieza por:

- [Wiki](https://github.com/nicotordev/payku-sdk/wiki) (guías ampliadas)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [SUPPORT.md](./SUPPORT.md)
- [Discussions](https://github.com/nicotordev/payku-sdk/discussions)

## Licencia

MIT © [Nicolas Torres](https://github.com/nicotordev)
