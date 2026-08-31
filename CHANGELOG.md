# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `mall.get`: se mantiene **sin** Sign — sandbox no exige firma (vs nullification); docs PHP/JS muestran Sign, cURL solo Bearer.

## [1.1.0] - 2026-08-31

### Added

- `Payku.forCountry("CL" | "PE" | "VE")` y `Payku.fromEnvForCountry()` con clientes tipados (`PaykuChile`, `PaykuPeru`, `PaykuVenezuela`).
- Currency implícita por país y `PaykuUnsupportedFeatureError` para módulos no soportados.
- Transacciones scoped (`PaykuScopedTransactions`) y wallet parcial para PE/VE (`PaykuSharedWallet`).
- Export público de `isPaykuFailedResponse`, `isPaykuUnauthorizedResponse` y tipos de error JSON (`PaykuFailedResponse`, etc.).
- Helpers `buildMallMerchant`, `buildMarketplaceAffiliation`, `validateMarketplaceAffiliationPercentages`.
- Sección README **Errores y respuestas** y **Autenticación y firma** (Bearer, `buildSign`, matriz Sign).

### Fixed

- `mall.create` / `mall.get`: request (`email`, `payment`, `merchant` tuplas, urls) y responses tipadas (`PaykuMallCreateResponse` / `PaykuMallGetResponse`).
- `marketplace`: maclient/maaffiliation/transactions tipados; Sign solo en `PUT /maclient`.
- `escrow.authorize`: `transactions: string[]` y response de settlement tipada.
- `nullification`: body/responses tipados; Sign en create y get (sandbox).
- `wallet`: withdraw/payout/balance/movements alineados a docs Chile.
- `subscriptions`: wire `suscription`/`card`; `suclient` tipado.

### Changed

- Tests de integración: opt-in `bun run test:integration` (tokens + `PAYKU_ENVIRONMENT=sandbox`).
- `bun run test` ejecuta solo `test:unit`.

## [1.0.0] - 2026-08-29

### Added

- Facade `Payku` con clientes por recurso (`transactions`, `wallet`, `banks`, `paymentMethods`, `webhooks`, `subscriptions`, `marketplace`, `mall`, `events`, `escrow`, `nullification`, `conciliation`, `consumptionSubscriptions`).
- Firma HMAC centralizada (`buildSign`) para endpoints sensibles.
- Verificación de webhooks `urlnotify` con re-consulta a la API.
- Soporte Venezuela On-Site (`transactions.confirmOnSite`).
- Tipos TypeScript por dominio bajo `src/types/payku.*`.
- Jerarquía de errores tipados (`PaykuError`, `PaykuAPIError`, errores por operación).
- Tests unitarios (firma, webhooks, transacciones con axios-mock-adapter).
- Tests de integración gated.
- Documentación: `docs/sdk-spec.md`, `README.md`, `SECURITY.md`.
- CI GitHub Actions (`verify-build.yml`).

### Changed

- Estructura del SDK migrada de `src/resources/` a `src/clients/`.
- Entry point unificado en `src/index.ts`.

[Unreleased]: https://github.com/nicotordev/payku-sdk/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/nicotordev/payku-sdk/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/nicotordev/payku-sdk/releases/tag/v1.0.0
