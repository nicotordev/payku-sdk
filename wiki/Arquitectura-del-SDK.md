# Arquitectura del SDK

Resumen de [`docs/sdk-spec.md`](https://github.com/nicotordev/payku-sdk/blob/main/docs/sdk-spec.md).

## Principios

- **Facade:** clase `Payku` con propiedades por dominio (`transactions`, `wallet`, …)
- **Cliente por recurso:** `src/clients/payku.{dominio}.ts`
- **HTTP centralizado:** `HttpClient` (axios + Bearer + `Sign` opcional)
- **País:** `Payku.forCountry("CL"|"PE"|"VE")` fija moneda y módulos tipados
- **Errores:** inspeccionar JSON `{ status: "failed" }`, no solo HTTP status

## Estructura

```text
src/
├── clients/payku.ts          # facade
├── clients/payku.*.ts        # por módulo API
├── types/payku.*.ts          # request/response
├── http/client.ts, sign.ts
├── utils/payku.utils.ts      # validaciones
└── __tests__/
```

## Convenciones de nombres

| Capa    | Convención                                 | Ejemplo                         |
| ------- | ------------------------------------------ | ------------------------------- |
| Tipos   | `Payku{Action}{Entity}{Request\|Response}` | `PaykuCreateTransactionRequest` |
| Métodos | verbos `create`, `get`, `list`             | `transactions.create`           |
| Errores | `{Operation}Error` extends `PaykuAPIError` | (roadmap F7)                    |

## Módulos por país

| Módulo                                       | CL   | PE      | VE      |
| -------------------------------------------- | ---- | ------- | ------- |
| Transacción                                  | ✓    | ✓       | ✓       |
| On-Site confirm                              | —    | —       | ✓       |
| Bancos / métodos pago                        | ✓    | ✓       | ✓       |
| Wallet                                       | full | partial | partial |
| Escrow, anulación, marketplace, mall, evento | ✓    | —       | —       |
| Suscripción / consumo                        | ✓    | —       | —       |
| Conciliación                                 | ✓    | —       | —       |
| Webhooks                                     | ✓    | ✓       | ✓       |

## Tests

- **Unit:** `bun run test` / `bun run test:unit` (CI siempre; bare `bun test` también unit-only vía `bunfig.toml`)
- **Integración:** `bun run test:integration` (sandbox + tokens reales en `.env`)

## TypeDoc

```bash
bun run docs:api   # → docs/api/ (gitignored, generar localmente)
```
