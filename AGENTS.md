---
name: payku-sdk
description: Guidance for AI assistants working in the @nicotordev/payku repository
---

# Payku SDK agent guide

## Project

TypeScript SDK (`@nicotordev/payku`) for the Payku LATAM payments API. Runtime/tooling is **Bun**.

## Hard rules

- Use Bun (`bun install`, `bun test`, `bun run build`), not npm/yarn/jest/ts-node/dotenv.
- Never commit secrets (`.env`, tokens, Sign payloads).
- Prefer extending existing clients in `src/clients/` over inventing parallel APIs.
- Country-specific DX goes through `Payku.forCountry("CL"|"PE"|"VE")`.
- Keep public naming: `Payku{Action}{Entity}{Request|Response}`.
- Do not mention third-party reference SDKs in user-facing docs.

## Key paths

- Facade: `src/clients/payku.ts`
- Spec: `docs/sdk-spec.md`
- API reference dump: `docs/payku.md`
- Tests: `src/__tests__/`, `src/http/sign.test.ts`

## Before finishing

Run `bun run lint && bun run build && bun run test:unit`.
