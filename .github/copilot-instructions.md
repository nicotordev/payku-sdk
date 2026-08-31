# GitHub Copilot instructions for payku-sdk

You are helping maintain `@nicotordev/payku`, an open-source TypeScript SDK for Payku.

## Stack

- Package manager / test runner / bundler: **Bun**
- Declarations: `tsc` with `emitDeclarationOnly`
- HTTP: axios + HMAC sign in `src/http/`

## Conventions

- Resource clients live in `src/clients/payku.*.ts`
- Types in `src/types/payku.*.ts`
- Prefer `Payku.forCountry()` for single-market apps
- Validate Chile create rules carefully (payment methods, `payer_rut` for Etpay/Fintoc/Floid)
- Webhooks must re-fetch `GET /api/transaction/{payment_key}` — never trust `urlnotify` alone

## Do not

- Add dotenv
- Enable integration tests in CI
- Log Authorization / Sign headers
- Invent undocumented Payku endpoints without citing `docs/payku.md`

## Verification

```bash
bun run lint
bun run build
bun run test:unit
```

## Pull request reviews

- **SDK code** (`src/**`, tests, `package.json`, workflows): human review required.
- **Docs / community** (see [`.github/copilot-approval-paths.txt`](./copilot-approval-paths.txt)): Copilot may approve when enabled under **Settings → Copilot → Code review**.
- Never approve changes that add secrets, weaken CI, or alter HTTP/sign behavior without tests.
