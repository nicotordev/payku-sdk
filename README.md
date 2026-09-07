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
});

// currency implícita: CLP — no hace falta pasarla
await payku.transactions.create({
  amount: 1000,
  payment: 1,
  order: "orden-001",
  email: "cliente@example.com",
  subject: "Compra test",
  urlreturn: "https://tu-sitio.com/return",
  urlnotify: "https://tu-sitio.com/notify",
});

// También desde .env
const fromEnv = Payku.fromEnvForCountry("CL");
```

| País | Cliente          | Moneda | Extra                                                             |
| ---- | ---------------- | ------ | ----------------------------------------------------------------- |
| `CL` | `PaykuChile`     | CLP    | suscripciones, marketplace, mall, escrow, withdraw, conciliación… |
| `PE` | `PaykuPeru`      | PEN    | core compartido                                                   |
| `VE` | `PaykuVenezuela` | VES    | `transactions.confirmOnSite`                                      |

Si llamás un módulo no soportado (p. ej. `wallet.withdraw` en Perú), el SDK lanza `PaykuUnsupportedFeatureError`.

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

El SDK firma solo donde corresponde (`signed: true`). Para integraciones custom exporta `buildSign`:

```typescript
import { buildSign } from "@nicotordev/payku";

const sign = buildSign(
  "/api/suclient",
  {
    email: "johndoe@example.com",
    name: "John Doe",
    phone: "923122312",
    address: "Moneda 101",
    country: "Chile",
    region: "Metropolitana",
    city: "Santiago",
    postal_code: "850000",
    additional_parameters: {
      parameter_1: "example",
      parameter_2: "example 2",
    },
  },
  process.env.PAYKU_PRIVATE_TOKEN!,
);

// Header: Sign: <sign>
```

### Matriz Sign por módulo (SDK)

| Módulo                                       | Sign    | Notas                                                                                       |
| -------------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `transactions`                               | No      | create/get/list (y On-Site VE)                                                              |
| `banks` / `paymentMethods`                   | No      | Catálogo                                                                                    |
| `conciliation`                               | No      |                                                                                             |
| `escrow` / `events`                          | No      |                                                                                             |
| `wallet`                                     | Sí      | payout, withdraw, balance, movements, get payout                                            |
| `subscriptions` / `consumptionSubscriptions` | Sí      | CRUD clientes, planes, tarjetas, txs                                                        |
| `nullification`                              | Sí      | create y get (GET también: docs omiten Sign, sandbox responde `waiting sign`)               |
| `mall`                                       | Parcial | create sí; get no (sandbox: sin Sign; docs PHP/JS muestran Sign opcional)                   |
| `marketplace`                                | Parcial | Solo `maclient` update (`PUT`); create/delete/get y `maaffiliation` / tx sin Sign (sandbox) |

Referencia oficial y colección Postman: [docs.payku.com](https://docs.payku.com/) · [colección CL](https://docs.payku.com/postman/payku-cl-es.postman_collection.json) · [environment](https://docs.payku.com/postman/payku-environment.postman_environment.json).

## Transacciones

```typescript
// Con forCountry("CL") — currency ya fijada
const order = await payku.transactions.create({
  email: "cliente@example.com",
  order: "orden-001",
  subject: "Compra test",
  amount: 1000,
  payment: 1,
  urlreturn: "https://tu-sitio.com/return",
  urlnotify: "https://tu-sitio.com/notify",
});

// Redirigir al pagador
console.log(order.url);
```

`expired` es opcional (`YYYY-MM-DD HH:mm:ss`, hora Santiago). Si se envía, el SDK exige `urlreturn` y que la fecha sea **más de 5 minutos** después de ahora (`America/Santiago`, vía `Intl`). Si la transacción expira, Payku redirige a `urlreturn?message_error=expired&id=…`.

### Retorno de pasarela (`urlreturn`) y expiración

Puedes parsear los parámetros devueltos por Payku a la `urlreturn` usando `parsePaymentReturnQuery`:

```typescript
import { parsePaymentReturnQuery } from "@nicotordev/payku";

// Acepta URL completa, query string, URLSearchParams o un objeto query (Next.js / Express)
const result = parsePaymentReturnQuery(req.query); // o searchParams / window.location.search

if (result.expired) {
  console.log(`La transacción ${result.id} ha expirado.`);
} else {
  console.log(`Transacción retornada id: ${result.id}, status: ${result.status}`);
}
```

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
```

#### Con cliente global

```typescript
const payku = Payku.fromEnv();
// Filtrar por moneda
const clpMethods = await payku.paymentMethods.list({ currency: "clp" });
// O consultar todos los medios disponibles sin filtro
const allMethods = await payku.paymentMethods.list();
```

#### Uso en creación de transacciones (`transactions.create`)

Cada método de pago incluye un identificador numérico `payment` (ej. `1` para Webpay Plus, `4` para ETpay, `9` para MACH). Este código se utiliza en el campo `payment` al crear una transacción:

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

Payku usa nombres distintos para el mismo rechazo:

| Origen                         | Valores                                              |
| ------------------------------ | ---------------------------------------------------- |
| Payload `urlnotify`            | `success` \| `failed`                                |
| `GET /api/transaction` (API)   | `register` \| `pending` \| `success` \| `rejected`   |

`verifyNotify` reconsulta la API. Si no pasas `expectedStatus`, deriva el esperado del `payload.status` (`failed` → `rejected`). También puedes usar `mapNotifyStatusToTransactionStatus`.

## Errores y respuestas

Según la [introducción de la API Payku](https://docs.payku.com/), **no confíes solo en el código HTTP** (p. ej. 200). Muchas respuestas de error llegan con HTTP 200 y un JSON de negocio:

| `status` en el JSON                      | Significado                                |
| ---------------------------------------- | ------------------------------------------ |
| `"success"` / `"pending"` / `"register"` | Flujo OK (según endpoint)                  |
| `"failed"`                               | Error de negocio (`type`, `message_error`) |

Este SDK ya inspecciona el body en `HttpClient`: si `status === "failed"` (o `type === "Unauthorized"`), lanza un error tipado en lugar de devolver el JSON.

### try / catch con el SDK

```typescript
import Payku, { PaykuAPIError, isPaykuError } from "@nicotordev/payku";

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

  if (isPaykuError(error)) {
    console.error(error.message, error.statusCode, error.type);
    return;
  }

  throw error;
}
```

### Inspeccionar JSON crudo

Si lees respuestas API fuera del cliente (proxy, log), usa los type guards públicos:

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
  accountbank_name: "Juan Pérez",
  accountbank_rut: "111111111",
  accountbank_sbif: "0001", // Código SBIF del banco
  accountbank_type: "1",    // "1" Corriente, "2" Vista / Cuenta RUT, "3" Ahorro
  accountbank_num: "123456789",
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
- Para el resto de los bancos en Chile, los números de cuenta no están estandarizados y pueden tener longitudes variables.

### Ambiente Sandbox (`des.payku.cl`)

En el ambiente de desarrollo (`sandbox`), Payku procesa los montos de payout de forma predecible para facilitar tus pruebas:

| Montos | Resultado en Sandbox |
| --- | --- |
| `1000`, `2000`, `3000` | Auto-aprobados (`success`) |
| `1500`, `2500`, `3500` | Auto-rechazados (`banking_error`) |

También puedes importar la constante `PAYKU_WALLET_SANDBOX_AMOUNTS` desde `@nicotordev/payku`:

```typescript
import { PAYKU_WALLET_SANDBOX_AMOUNTS } from "@nicotordev/payku";
```


## Anulación (Chile)

```typescript
const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "sandbox",
});

const nullify = await payku.nullification.create({
  id: "trxpr2a45s1dytg1",
  amount: 25000,
  subject: "anulación transacción",
});
```

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

## Suscripciones (Chile)

```typescript
const client = await payku.subscriptions.clients.create({
  email: "cliente@example.com",
  name: "Cliente Test",
});

const subscription = await payku.subscriptions.subscriptions.create({
  plan: "pl...",
  client: client.id as string,
});
```

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
    ["a@x.com", 50],
    ["b@x.com", 50],
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
