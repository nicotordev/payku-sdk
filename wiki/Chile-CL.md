# Chile (CL)

Cliente: `Payku.forCountry("CL")` → `PaykuChile`, moneda **CLP** implícita.

## Sandbox

`environment: "sandbox"` → `https://des.payku.cl`. Producción: `https://app.payku.cl`.

Tarjetas de prueba (cualquier expiración futura; CVV `123`, AMEX `1234`): VISA `4051 8856 0044 6623` (ok), MASTERCARD `5186 0595 5959 0568` (rechazo). Formulario Webpay: RUT `11.111.111-1`, clave `123`. Tabla completa en el [README](https://github.com/nicotordev/payku-sdk/blob/main/README.md#sandbox-chile).

## Transacciones

```typescript
const order = await payku.transactions.create({
  email: "cliente@example.com",
  order: "orden-001",
  subject: "Compra test",
  amount: 1000,
  payment: 1, // Webpay; ver catálogo
  urlreturn: "https://tu-sitio.com/return",
  urlnotify: "https://tu-sitio.com/notify",
});

// Redirigir al pagador
console.log(order.url);
```

### Reglas CLP (auditoría en curso)

Issues abiertos cubren validaciones que aún faltan en el SDK:

- `payer_rut` obligatorio para Etpay (4), Fintoc (19), Floid (26)
- Reglas de `expired` + `urlreturn`
- Endurecer campos requeridos en create Chile

Ver [Roadmap Chile](Roadmap-Chile) y label [`chile`](https://github.com/nicotordev/payku-sdk/issues?q=label%3Achile).

## Catálogo

```typescript
const methods = await payku.paymentMethods.list({ currency: "clp" });
const banks = await payku.banks.list({ currency: "clp" });
```

## Wallet

```typescript
const balance = await payku.wallet.balance.get();
const movements = await payku.wallet.movements.list({ page: 1, per_page: 20 });
// payout / withdraw — endpoints firmados (Sign)
```

## Marketplace

Diagrama: [Marketplace](https://docs.payku.com/img/diagrams/Diagrama-Marketplace.png). Sign solo en `clients.update`.

```typescript
const client = await payku.marketplace.clients.create({
  email: "vendedor@example.com",
  name: "Vendedor Test",
  phone: "923122312",
  bank: { sbif: "0001", type: "1", num: "12312313121", rut: "111111111" },
});
const aff = await payku.marketplace.affiliations.create({
  name: "market1",
  percentage: "20",
  affiliation: [[client.id, "80"]],
});
const order = await payku.marketplace.transactions.create({
  email: "comprador@example.com",
  order: "mkt-001",
  subject: "Pedido",
  amount: 10000,
  payment: 1,
  urlreturn: "https://tu-sitio.com/return",
  urlnotify: "https://tu-sitio.com/notify",
  marketplace: aff.token,
});
console.log(order.url);
```

## Mall

Diagrama: [Mall](https://docs.payku.com/img/diagrams/Diagrama-Mall.png). `create` con Sign; `get` Bearer. Ids `mall…`. Confirmar notify con `mall.verifyNotify`.

```typescript
const mall = await payku.mall.create({
  email: "comprador@example.com",
  payment: 1,
  merchant: [["TOKEN_O_AFILIACION", 30000, "item1", null, "4545"]],
  order: 123,
  urlreturn: "https://tu-sitio.com/return",
  urlnotify: "https://tu-sitio.com/notify",
});
await payku.mall.get(mall.id);
```

## Suscripciones

Planes recurrentes. Diagrama: [Suscripción](https://docs.payku.com/img/diagrams/Diagrama-Suscripcion.png). Alta cobra $50 para validar tarjeta; plan fijo cobra desde el mes siguiente. Wire typos: `suscription`, `subcriptions`, `url_notify_suscription`.

```typescript
const client = await payku.subscriptions.clients.create({
  email: "cliente@example.com",
  name: "Cliente Test",
  phone: "923122312",
});
const { plans } = await payku.subscriptions.plans.list();
const subscription = await payku.subscriptions.subscriptions.create({
  plan: plans[0].id,
  client: client.id as string,
});

// urlnotifysuscription vs urlnotifypayment (no son urlnotify de trx…)
await payku.subscriptions.verifyActivationNotify({
  id: subscription.id,
  status: "active",
});
await payku.subscriptions.verifyPaymentNotify({
  transaction_id: 9123123,
  verification_key: "…",
  order: "1568041684",
  status: "success",
  subscriptions: { id: subscription.id, client: client.id },
});
```

Cargos únicos de delivery **no** van aquí: usar `consumptionSubscriptions.transactions.create`.

## Consumo vs suscripción

`consumptionSubscriptions` (cargos únicos, paths con `/` final) no reemplaza a `subscriptions` (CRUD, get/list, `cards.register`). Superficie de consumo: `clients.create`, `plans.create`, `subscriptions.create`, `transactions.create`, `cards.delete`. Flujo: plan → cliente → suscripción → un `sutransaction` por cargo. Los notify de activación/cobro se verifican igual: `subscriptions.verifyActivationNotify` / `verifyPaymentNotify`.

```typescript
const plan = await payku.consumptionSubscriptions.plans.create({
  name: "Delivery",
  url_notify_payment: "https://tu-sitio.com/notify-payment",
});
const client = await payku.consumptionSubscriptions.clients.create({
  email: "cliente@example.com",
  name: "Cliente Test",
  phone: "923122312",
});
const sub = await payku.consumptionSubscriptions.subscriptions.create({
  plan: plan.id,
  client: client.id as string,
});
await payku.consumptionSubscriptions.transactions.create({
  suscription: sub.id,
  amount: "10000",
  order: "001",
});
```

Diagrama del cargo: [sutransaction](https://docs.payku.com/img/diagrams/Diagrama-Sutransaction.png).

## Solo Chile

También expuestos en `PaykuChile`: marketplace, mall, eventos, escrow, anulación, conciliación, consumo por suscripción.

Referencia API en repo: [`docs/payku.md`](https://github.com/nicotordev/payku-sdk/blob/main/docs/payku.md)
