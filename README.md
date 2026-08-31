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

## Wallet (Chile)

```typescript
const balance = await payku.wallet.balance.get();
const movements = await payku.wallet.movements.list({ page: 1, per_page: 20 });
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
bun run test:unit
PAYKU_RUN_INTEGRATION_TESTS=true bun run test:integration
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
