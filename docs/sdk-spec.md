# Especificación del SDK Payku

Guía de desarrollo para `@nicotordev/payku`. Define arquitectura, convenciones y roadmap de implementación contra la API documentada en [`payku.md`](./payku.md).

## 1. Principios de diseño

- **Facade único**: la clase `Payku` expone propiedades por dominio (`transactions`, `wallet`, `subscriptions`, etc.).
- **Cliente por recurso**: un archivo por módulo API en `src/clients/payku.{dominio}.ts`.
- **HTTP compartido**: `HttpClient` centralizado (axios + Bearer + header `Sign` opcional).
- **Firma HMAC**: utilidad en `src/http/sign.ts`; endpoints sensibles usan `signed: true`.
- **Moneda/país por request**: misma base URL (`app.payku.cl` / `des.payku.cl`); el mercado se elige con `currency` y métodos habilitados del comercio.
- **Cliente por país**: `Payku.forCountry("CL" | "PE" | "VE")` fija currency y tipa solo los módulos soportados; el modo global `new Payku()` sigue disponible.
- **Errores de negocio**: inspeccionar siempre el JSON (`status: "failed"`), no solo el código HTTP.
- **Build**: Bun empaqueta JS; `tsc` emite `.d.ts` (`emitDeclarationOnly`).

## 2. Estructura de carpetas

```text
src/
├── index.ts
├── errors.ts
├── clients/
│   ├── payku.ts
│   ├── payku.transactions.ts
│   ├── payku.wallet.ts
│   ├── payku.subscriptions.ts
│   ├── payku.consumption-subscriptions.ts
│   ├── payku.marketplace.ts
│   ├── payku.mall.ts
│   ├── payku.events.ts
│   ├── payku.escrow.ts
│   ├── payku.nullification.ts
│   ├── payku.conciliation.ts
│   ├── payku.banks.ts
│   ├── payku.payment-methods.ts
│   └── payku.webhooks.ts
├── types/
│   ├── payku.common.ts
│   ├── payku.responses.ts
│   ├── payku.transactions.ts
│   ├── payku.wallet.ts
│   ├── payku.webhooks.ts
│   ├── payku.subscriptions.ts
│   ├── payku.marketplace.ts
│   ├── payku.mall.ts
│   ├── payku.events.ts
│   ├── payku.escrow.ts
│   ├── payku.nullification.ts
│   ├── payku.conciliation.ts
│   ├── payku.banks.ts
│   ├── payku.payment-methods.ts
│   └── payku.ts
├── utils/payku.utils.ts
├── constants/payku.constants.ts
├── http/client.ts
├── http/sign.ts
├── test-utils/paykuIntegration.ts
└── __tests__/
```

## 3. Convenciones de API pública

| Capa      | Convención                                 | Ejemplo                         |
| --------- | ------------------------------------------ | ------------------------------- |
| Facade    | propiedad camelCase                        | `payku.transactions`            |
| Métodos   | verbos amigables                           | `create`, `get`, `list`         |
| Variantes | objetos anidados                           | `wallet.payouts.create`         |
| Tipos     | `Payku{Action}{Entity}{Request\|Response}` | `PaykuCreateTransactionRequest` |
| Errores   | `{Operation}Error` extends `PaykuAPIError` | `PaykuCreateTransactionError`   |
| Webhooks  | union `{ valid, reason }`                  | `payku.webhooks.verifyNotify()` |

## 4. Autenticación y firma

- **Todas las requests**: `Authorization: Bearer {TOKEN_PÚBLICO}`.
- **Requests firmadas** (`Sign`): wallet payout/withdraw, suscripciones, anulación, mall, marketplace writes, etc.
- **Algoritmo**: `HMAC-SHA256(urlencode('/api/path') + '&' + params_ordenados)`.

## 5. Módulos por país

| Módulo                                       |  CL  |   PE    |   VE    |
| -------------------------------------------- | :--: | :-----: | :-----: |
| Transacción                                  |  ✓   |    ✓    |    ✓    |
| On-Site confirm                              |  —   |    —    |    ✓    |
| Bancos / Métodos de pago                     |  ✓   |    ✓    |    ✓    |
| Wallet                                       | full | partial | partial |
| Escrow, Anulación, Marketplace, Mall, Evento |  ✓   |    —    |    —    |
| Suscripción / Consumo                        |  ✓   |    —    |    —    |
| Conciliación                                 |  ✓   |    —    |    —    |
| Webhooks (`urlnotify`)                       |  ✓   |    ✓    |    ✓    |

## 6. Tipos de respuesta

- **Create transaction**: `{ status, id, url }` + On-Site VE opcional.
- **List transactions**: `{ transaction: Transaction[] }`.
- **Get transaction**: `{ status, id, payment, nullify, gateway_response }`.
- **Errors**: `{ status: "failed", type, message_error }` o `{ type: "Unauthorized", message_error }`.
- **Notify**: `{ transaction_id, payment_key, verification_key, order, status }`.

## 7. Webhooks

`PaykuWebhooks` recibe el payload de `urlnotify`, re-consulta la transacción vía API y valida estado/orden/monto. No confía ciegamente en el POST entrante.

## 8. Testing

- **Unit** (`bun test`): firma, errores, webhooks con mock, guards de auth.
- **Integración** (gated): `PAYKU_RUN_INTEGRATION_TESTS=false` en CI; credenciales desde `.env`.

## 9. Roadmap por fases

Ver issues en el repositorio alineados a:

- **Fase 0**: spec + refactor base
- **Fase 1**: transactions, banks, paymentMethods, webhooks
- **Fase 2**: wallet (firmado)
- **Fase 3**: Venezuela On-Site
- **Fase 4**: suscripciones Chile
- **Fase 5**: marketplace, mall, eventos, escrow, anulación, conciliación, consumo
- **Fase 6**: README, SECURITY.md, CI, release v1.0.0
