# Chile (CL)

Cliente: `Payku.forCountry("CL")` → `PaykuChile`, moneda **CLP** implícita.

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

## Suscripciones

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

## Solo Chile

También expuestos en `PaykuChile`: marketplace, mall, eventos, escrow, anulación, conciliación, consumo por suscripción.

Referencia API en repo: [`docs/payku.md`](https://github.com/nicotordev/payku-sdk/blob/main/docs/payku.md)
