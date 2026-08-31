# Payku — Cliente API para TypeScript

SDK en TypeScript para integrar [Payku](https://payku.com/about), la pasarela de pagos LATAM.

## Instalación

```bash
bun add @nicotordev/payku
```

## Configuración

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

## Transacciones

```typescript
const order = await payku.transactions.create({
  email: "cliente@example.com",
  order: "orden-001",
  subject: "Compra test",
  amount: 1000,
  currency: "CLP",
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

## Licencia

MIT
