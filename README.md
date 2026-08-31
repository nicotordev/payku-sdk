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

| País | Cliente          | Moneda | Extra                                               |
| ---- | ---------------- | ------ | --------------------------------------------------- |
| `CL` | `PaykuChile`     | CLP    | suscripciones, marketplace, mall, escrow, withdraw… |
| `PE` | `PaykuPeru`      | PEN    | core compartido                                     |
| `VE` | `PaykuVenezuela` | VES    | `transactions.confirmOnSite`                        |

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

| Módulo                                       | Sign    | Notas                                                             |
| -------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `transactions`                               | No      | create/get/list (y On-Site VE)                                    |
| `banks` / `paymentMethods`                   | No      | Catálogo                                                          |
| `conciliation`                               | No      |                                                                   |
| `escrow` / `events`                          | No      |                                                                   |
| `wallet`                                     | Sí      | payout, withdraw, balance, movements, get payout                  |
| `subscriptions` / `consumptionSubscriptions` | Sí      | CRUD clientes, planes, tarjetas, txs                              |
| `nullification`                              | Sí      | create y get (GET también: docs omiten Sign, sandbox responde `waiting sign`) |
| `mall`                                       | Parcial | create sí; get no                                                 |
| `marketplace`                                | Parcial | `maclient` create/update/delete sí; get y `maaffiliation` / tx no |

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

## Catálogo

```typescript
const methods = await payku.paymentMethods.list({ currency: "clp" });
const banks = await payku.banks.list({ currency: "clp" });
```

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

## Wallet (Chile)

```typescript
const balance = await payku.wallet.balance.get();
const movements = await payku.wallet.movements.list({ page: 1, per_page: 20 });
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

```typescript
const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "sandbox",
});

await payku.escrow.authorize({
  transactions: ["trx3b4d77b43acd9a720", "trx3b4d77b43acd9a385"],
});
```

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
bun run test:integration # smoke sandbox (requiere tokens + PAYKU_ENVIRONMENT=sandbox)
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
