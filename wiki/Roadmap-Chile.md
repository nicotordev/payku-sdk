# Roadmap Chile

Auditoría **Payku Docs → SDK** solo para Chile (`CL`). Detalle completo en [`docs/CL-development-roadmap.md`](https://github.com/nicotordev/payku-sdk/blob/main/docs/CL-development-roadmap.md).

Tracker meta: [#101](https://github.com/nicotordev/payku-sdk/issues/101)

## Seguimiento

| Recurso          | Enlace                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ |
| Project board    | [Auditoría Chile (CL)](https://github.com/users/nicotordev/projects/4)               |
| Tablero por Fase | [View 2](https://github.com/users/nicotordev/projects/4/views/2)                     |
| P0 bugs          | [View 4](https://github.com/nicotordev/payku-sdk/issues?q=label%3Abug+label%3Achile) |
| Milestones       | [CL F0 … CL F9](https://github.com/nicotordev/payku-sdk/milestones)                  |

## Fases (resumen)

| Fase  | Enfoque                                                               |
| ----- | --------------------------------------------------------------------- |
| F0    | Fundamentos HTTP, errores, Sign README                                |
| F1    | Suscripciones — tipos compartidos (`suscription`, cards)              |
| F2    | **P0 wire format** — wallet, anulación, escrow, marketplace, consumo… |
| F3    | Transacciones CL — validación, `payer_rut`, expired                   |
| F4–F7 | Validación runtime, tests, webhooks, errores tipados                  |
| F8–F9 | DX, documentación                                                     |

## MVP P0 (bugs de wire format)

Orden sugerido para primeras PRs:

1. Suscripciones #54, #55, #53
2. Wallet #72, #74
3. Anulación #22
4. Escrow #16
5. Marketplace #32
6. Consumo #63, #67

## Contribuir al roadmap

- Issues con label [`chile`](https://github.com/nicotordev/payku-sdk/issues?q=label%3Achile)
- Template [Docs / API parity](https://github.com/nicotordev/payku-sdk/issues/new?template=docs_parity.yml)
