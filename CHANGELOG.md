# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `nullification.get`: se mantiene `signed: true` — sandbox exige Sign (`401 waiting sign` sin header); docs incompletas. Test unitario + nota en README/sdk-spec.
- `nullification.create`: body tipado `id`, `amount`, `subject` (eliminado `transaction`, que no existe en docs); ejemplo README Chile.
- `wallet.balance` / `movements.list` / `movements.get`: `PaykuWalletFilter` tipado; list response alineada a balance (`current_id`, `amount_available`, `currency`, `filter`); JSDoc de typos API (`update_at`, “moviminto”).
- `wallet.payouts.get` / `getV3`: response anidada `{ payout: … }` (`PaykuGetPayoutResponse` / `PaykuGetPayoutV3Response` con `reason_rejection`); statuses documentados.
- `wallet.payouts.create` / `wallet.withdraw.create`: responses tipadas `PaykuCreateWalletPayoutResponse` (`identifier_wallet`, `identifier_payout`) y `PaykuCreateWalletWithdrawResponse` (`identifier_wallet`).
- `wallet.withdraw.create`: request solo `subject`/`currency`/`order`/`amount`; response `{ status, identifier_wallet }` (ya no reutiliza campos de payout).
- `subscriptions.clients` (`suclient`): create exige `email`/`name`/`phone`; update parcial; response tipada con typos API (`update_at`, `subcriptions`); delete `{ status, id }`.
- `subscriptions.cards.register`: body usa `suscription` (no `client`); response tipada (`status`, `id`, `url`).
- `subscriptions.cards.delete` / consumo: body usa `card` (wire Payku; ejemplos docs); response tipada (`status`, `card`).
- `subscriptions.transactions.create` / consumo: body usa `suscription` (wire Payku) y response tipada (`transaction_id`, `verification_key`, …).

### Added

- Export público de `isPaykuFailedResponse`, `isPaykuUnauthorizedResponse` y tipos de error JSON (`PaykuFailedResponse`, etc.) para inspeccionar respuestas crudas.
- Sección README **Errores y respuestas** (HTTP 200 + `status: "failed"`, try/catch con `PaykuAPIError`).
- Sección README **Autenticación y firma** (Bearer, `buildSign`, matriz Sign, links Postman).

### Changed

- Tests de integración ya no usan `PAYKU_RUN_INTEGRATION_TESTS`; el opt-in es `bun run test:integration` con tokens + `PAYKU_ENVIRONMENT=sandbox`.
- `bun run test` ejecuta solo la suite unitaria (`test:unit`).

## [1.1.0] - 2026-08-30

### Added

- `Payku.forCountry("CL" | "PE" | "VE")` y `Payku.fromEnvForCountry()` con clientes tipados (`PaykuChile`, `PaykuPeru`, `PaykuVenezuela`).
- Currency implícita por país y `PaykuUnsupportedFeatureError` para módulos no soportados.
- Transacciones scoped (`PaykuScopedTransactions`) y wallet parcial para PE/VE (`PaykuSharedWallet`).

## [1.0.0] - 2026-08-30

### Added

- Facade `Payku` con clientes por recurso (`transactions`, `wallet`, `banks`, `paymentMethods`, `webhooks`, `subscriptions`, `marketplace`, `mall`, `events`, `escrow`, `nullification`, `conciliation`, `consumptionSubscriptions`).
- Firma HMAC centralizada (`buildSign`) para endpoints sensibles.
- Verificación de webhooks `urlnotify` con re-consulta a la API.
- Soporte Venezuela On-Site (`transactions.confirmOnSite`).
- Tipos TypeScript por dominio bajo `src/types/payku.*`.
- Jerarquía de errores tipados (`PaykuError`, `PaykuAPIError`, errores por operación).
- Tests unitarios (firma, webhooks, transacciones con axios-mock-adapter).
- Tests de integración gated (`PAYKU_RUN_INTEGRATION_TESTS`).
- Documentación: `docs/sdk-spec.md`, `README.md`, `SECURITY.md`.
- CI GitHub Actions (`verify-build.yml`).

### Changed

- Estructura del SDK migrada de `src/resources/` a `src/clients/`.
- Entry point unificado en `src/index.ts`.

[1.0.0]: https://github.com/nicotordev/payku-sdk/releases/tag/v1.0.0
