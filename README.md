# Payku — Cliente API para TypeScript

SDK en TypeScript para integrar [Payku](https://payku.com/about), la pasarela de pagos LATAM.

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
