# Perú y Venezuela

## Perú (`PE`)

```typescript
const payku = Payku.forCountry("PE", {/* tokens */});
```

- Moneda: **PEN**
- Módulos: transacciones, bancos, métodos de pago, wallet (parcial), webhooks
- Sin suscripciones Chile, marketplace, escrow, etc.

## Venezuela (`VE`)

```typescript
const payku = Payku.forCountry("VE", {/* tokens */});
```

- Moneda: **VES**
- Flujo **On-Site**: confirmación en terminal vía `transactions.confirmOnSite`
- Wallet parcial; sin módulos exclusivos de Chile

## Modo global

Si operas varios países desde una sola instancia `new Payku()`, pasa `currency` en cada operación y revisa qué métodos existen en el facade global vs `forCountry`.

## Roadmaps

- Chile: [Roadmap Chile](Roadmap-Chile) (activo)
- PE / VE: roadmaps de auditoría pendientes (issues futuros)
