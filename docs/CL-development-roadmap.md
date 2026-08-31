# CL — Roadmap de desarrollo (Chile)

> **Alcance: solo Chile (`CL`).**
> Este documento ordena los issues derivados de la auditoría **Payku Docs → SDK** contra la documentación de Chile (`app.payku.cl` / `des.payku.cl`, moneda **CLP**, módulos expuestos en `Payku.forCountry("CL")`).
>
> **No cubre** audits ni roadmaps de Perú (`PE`) ni Venezuela (`VE`). Cuando existan, usar archivos separados (p. ej. `PE-development-roadmap.md`, `VE-development-roadmap.md`).

Orden recomendado para implementar los tickets abiertos del SDK (`nicotordev/payku-sdk`), de **mayor impacto en runtime** a **documentación y DX**.

Referencia meta: [#101](https://github.com/nicotordev/payku-sdk/issues/101) (tracker auditoría Chile).

### Qué incluye / qué no

| Incluido en este roadmap                                                                                                                                | Fuera de alcance (CL doc)                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Issues con label `chile` o módulos **solo CL** (suscripciones, consumo, escrow, mall, marketplace, eventos, anulación, conciliación, `wallet.withdraw`) | On-Site Venezuela, flujos exclusivos PE/VE |
| Transacciones Chile (#7–#15): reglas CLP, `payer_rut`, Webpay, etc.                                                                                     | Audit docs PE/VES pendiente                |
| Fase 0 `core-api` (#96–#100): infra del SDK (aplica a todos los países, priorizada desde audit CL)                                                      | —                                          |
| Bancos / métodos de pago / wallet parcial (#72–#79, #86–#95): docs Chile; PE/VE comparten cliente pero no se ordenan aquí                               | Orden específico PE/VES                    |

---

## Criterios de orden

1. **Infra compartida** — lo que desbloquea todos los módulos (errores HTTP, tipos reutilizados).
2. **P0 / `bug`** — requests o responses incorrectos que rompen llamadas reales a la API.
3. **Tipos P1** — respuestas incompletas que no rompen el wire format pero sí la DX TypeScript.
4. **Validación y Sign** — reglas de negocio y dudas de firma (validar en sandbox).
5. **Tests y fixtures** — por módulo, después de fijar tipos/contratos.
6. **Webhooks / verify** — dependen de tipos y de `transactions.get` / GET del recurso.
7. **Documentación** — README, sandbox CL, cuando el comportamiento ya esté estable.

Convención: **`→`** = conviene hacer antes; el mismo número en fases distintas indica cierre del mismo tema (tests/docs).

---

## Fase 0 — Fundamentos (1–2 PRs)

| Orden | Issue                                                      | Motivo                                                                         |
| ----: | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
|     1 | [#97](https://github.com/nicotordev/payku-sdk/issues/97)   | Test `HTTP 200` + `status: "failed"` — garantiza `HttpClient` para todo el SDK |
|     2 | [#100](https://github.com/nicotordev/payku-sdk/issues/100) | Exportar `isPaykuFailedResponse` / tipos de error (integradores y tests)       |
|     3 | [#96](https://github.com/nicotordev/payku-sdk/issues/96)   | Documentar patrón de errores (paralelo a #97)                                  |
|     4 | [#99](https://github.com/nicotordev/payku-sdk/issues/99)   | README auth + Sign + matriz endpoints firmados                                 |

---

## Fase 1 — Tipos compartidos de suscripciones (1 PR)

Varios módulos **Chile** usan `src/types/payku.subscriptions.ts`. Corregir aquí **antes** de consumo y tests duplicados.

| Orden | Issue                                                    | Motivo                                      |
| ----: | -------------------------------------------------------- | ------------------------------------------- |
|     5 | [#54](https://github.com/nicotordev/payku-sdk/issues/54) | `suscription` en `sutransaction` (P0)       |
|     6 | [#55](https://github.com/nicotordev/payku-sdk/issues/55) | `cards.register` / `cards.delete` body      |
|     7 | [#53](https://github.com/nicotordev/payku-sdk/issues/53) | Tipos `suclient` (create/get/update/delete) |

→ Desbloquea [#63](https://github.com/nicotordev/payku-sdk/issues/63), [#64](https://github.com/nicotordev/payku-sdk/issues/64), [#66](https://github.com/nicotordev/payku-sdk/issues/66).

---

## Fase 2 — P0 por módulo Chile (varias PRs pequeñas)

Priorizar módulos que hoy **serializan campos incorrectos** o **parsean responses mal**.

### 2a — Wallet (CL full; PE/VE sin withdraw)

| Orden | Issue                                                                                       |
| ----: | ------------------------------------------------------------------------------------------- |
|     8 | [#72](https://github.com/nicotordev/payku-sdk/issues/72) — withdraw request (solo 4 campos) |
|     9 | [#73](https://github.com/nicotordev/payku-sdk/issues/73) — create payout/withdraw responses |
|    10 | [#74](https://github.com/nicotordev/payku-sdk/issues/74) — GET payout `{ payout: { … } }`   |
|    11 | [#75](https://github.com/nicotordev/payku-sdk/issues/75) — balance / list / movements       |

### 2b — Anulación

| Orden | Issue                                                                                        |
| ----: | -------------------------------------------------------------------------------------------- |
|    12 | [#22](https://github.com/nicotordev/payku-sdk/issues/22) — request `id`, `amount`, `subject` |
|    13 | [#23](https://github.com/nicotordev/payku-sdk/issues/23) — responses create/get              |
|    14 | [#24](https://github.com/nicotordev/payku-sdk/issues/24) — Sign en GET (validar sandbox)     |

### 2c — Escrow

| Orden | Issue                                                                                        |
| ----: | -------------------------------------------------------------------------------------------- |
|    15 | [#16](https://github.com/nicotordev/payku-sdk/issues/16) — `transactions[]` vs `transaction` |
|    16 | [#17](https://github.com/nicotordev/payku-sdk/issues/17) — response authorize                |

### 2d — Marketplace

| Orden | Issue                                                                                 |
| ----: | ------------------------------------------------------------------------------------- |
|    17 | [#30](https://github.com/nicotordev/payku-sdk/issues/30) — maclient                   |
|    18 | [#31](https://github.com/nicotordev/payku-sdk/issues/31) — maaffiliation              |
|    19 | [#32](https://github.com/nicotordev/payku-sdk/issues/32) — `marketplace` en create tx |
|    20 | [#33](https://github.com/nicotordev/payku-sdk/issues/33) — Sign por operación         |

### 2e — Mall

| Orden | Issue                                                                           |
| ----: | ------------------------------------------------------------------------------- |
|    21 | [#38](https://github.com/nicotordev/payku-sdk/issues/38) — request create       |
|    22 | [#39](https://github.com/nicotordev/payku-sdk/issues/39) — responses create/get |
|    23 | [#40](https://github.com/nicotordev/payku-sdk/issues/40) — Sign en GET          |

### 2f — Eventos

| Orden | Issue                                                                                                     |
| ----: | --------------------------------------------------------------------------------------------------------- |
|    24 | [#46](https://github.com/nicotordev/payku-sdk/issues/46) — request create                                 |
|    25 | [#47](https://github.com/nicotordev/payku-sdk/issues/47) — create vs get (`affiliation` / `affiliations`) |

### 2g — Suscripción (resto tipos)

| Orden | Issue                                                                                 |
| ----: | ------------------------------------------------------------------------------------- |
|    26 | [#56](https://github.com/nicotordev/payku-sdk/issues/56) — sususcription CRUD/list/v3 |
|    27 | [#57](https://github.com/nicotordev/payku-sdk/issues/57) — suplan get vs list         |

### 2h — Suscripción de consumo

| Orden | Issue                                                                                         |
| ----: | --------------------------------------------------------------------------------------------- |
|    28 | [#67](https://github.com/nicotordev/payku-sdk/issues/67) — Sign + trailing slash (sandbox)    |
|    29 | [#63](https://github.com/nicotordev/payku-sdk/issues/63) — sutransaction + marketplace + card |
|    30 | [#64](https://github.com/nicotordev/payku-sdk/issues/64) — cards.delete `{ card }`            |
|    31 | [#65](https://github.com/nicotordev/payku-sdk/issues/65) — plans.create                       |
|    32 | [#66](https://github.com/nicotordev/payku-sdk/issues/66) — responses create                   |

### 2i — Conciliación

| Orden | Issue                                                                                         |
| ----: | --------------------------------------------------------------------------------------------- |
|    33 | [#80](https://github.com/nicotordev/payku-sdk/issues/80) — `conciliation[]` + `transaction[]` |

---

## Fase 3 — Transacciones Chile (mejoras P1)

El cliente de transacciones **funciona en CL**; estos tickets mejoran validación, webhooks y catálogo según docs Chile.

| Orden | Issue                                                    | Notas                          |
| ----: | -------------------------------------------------------- | ------------------------------ |
|    34 | [#11](https://github.com/nicotordev/payku-sdk/issues/11) | Campos requeridos create       |
|    35 | [#7](https://github.com/nicotordev/payku-sdk/issues/7)   | `payer_rut` Etpay/Fintoc/Floid |
|    36 | [#9](https://github.com/nicotordev/payku-sdk/issues/9)   | `expired` / `urlreturn`        |
|    37 | [#13](https://github.com/nicotordev/payku-sdk/issues/13) | Paginación list                |
|    38 | [#12](https://github.com/nicotordev/payku-sdk/issues/12) | Códigos `payment` CLP          |
|    39 | [#10](https://github.com/nicotordev/payku-sdk/issues/10) | Notify `failed` vs `rejected`  |
|    40 | [#14](https://github.com/nicotordev/payku-sdk/issues/14) | Fixtures create/get/list       |
|    41 | [#15](https://github.com/nicotordev/payku-sdk/issues/15) | Helper `urlreturn`             |

Relacionado catálogo CL: [#94](https://github.com/nicotordev/payku-sdk/issues/94) (payment-methods → transactions).

---

## Fase 4 — Validación por módulo

| Módulo        | Issues (orden sugerido)                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Suscripciones | [#60](https://github.com/nicotordev/payku-sdk/issues/60) → [#58](https://github.com/nicotordev/payku-sdk/issues/58) |
| Anulación     | [#25](https://github.com/nicotordev/payku-sdk/issues/25)                                                            |
| Escrow        | [#18](https://github.com/nicotordev/payku-sdk/issues/18)                                                            |
| Marketplace   | [#34](https://github.com/nicotordev/payku-sdk/issues/34)                                                            |
| Mall          | [#41](https://github.com/nicotordev/payku-sdk/issues/41)                                                            |
| Eventos       | [#48](https://github.com/nicotordev/payku-sdk/issues/48) → [#49](https://github.com/nicotordev/payku-sdk/issues/49) |
| Wallet        | [#77](https://github.com/nicotordev/payku-sdk/issues/77) — reglas SBIF Banco Estado (Chile)                         |
| Conciliación  | [#81](https://github.com/nicotordev/payku-sdk/issues/81)                                                            |

---

## Fase 5 — Tests unitarios (por módulo)

Hacer **después** de cerrar P0/P1 del mismo módulo.

| Orden | Issue                                                    | Módulo          |
| ----: | -------------------------------------------------------- | --------------- |
|    42 | [#27](https://github.com/nicotordev/payku-sdk/issues/27) | Anulación       |
|    43 | [#19](https://github.com/nicotordev/payku-sdk/issues/19) | Escrow          |
|    44 | [#35](https://github.com/nicotordev/payku-sdk/issues/35) | Marketplace     |
|    45 | [#43](https://github.com/nicotordev/payku-sdk/issues/43) | Mall            |
|    46 | [#50](https://github.com/nicotordev/payku-sdk/issues/50) | Eventos         |
|    47 | [#61](https://github.com/nicotordev/payku-sdk/issues/61) | Suscripción     |
|    48 | [#70](https://github.com/nicotordev/payku-sdk/issues/70) | Consumo         |
|    49 | [#78](https://github.com/nicotordev/payku-sdk/issues/78) | Wallet          |
|    50 | [#84](https://github.com/nicotordev/payku-sdk/issues/84) | Conciliación    |
|    51 | [#87](https://github.com/nicotordev/payku-sdk/issues/87) | Bancos (CLP)    |
|    52 | [#92](https://github.com/nicotordev/payku-sdk/issues/92) | Métodos de pago |

---

## Fase 6 — Webhooks y verify (seguridad)

| Orden | Issue                                                    | Depende de                |
| ----: | -------------------------------------------------------- | ------------------------- |
|    53 | [#8](https://github.com/nicotordev/payku-sdk/issues/8)   | Transacciones CL + notify |
|    54 | [#26](https://github.com/nicotordev/payku-sdk/issues/26) | Anulación #23             |
|    55 | [#42](https://github.com/nicotordev/payku-sdk/issues/42) | Mall #39                  |
|    56 | [#59](https://github.com/nicotordev/payku-sdk/issues/59) | Suscripción #56           |
|    57 | [#76](https://github.com/nicotordev/payku-sdk/issues/76) | Wallet #74                |

---

## Fase 7 — Errores tipados por dominio

Puede hacerse en paralelo con tests de cada módulo.

[#21](https://github.com/nicotordev/payku-sdk/issues/21), [#29](https://github.com/nicotordev/payku-sdk/issues/29), [#37](https://github.com/nicotordev/payku-sdk/issues/37), [#45](https://github.com/nicotordev/payku-sdk/issues/45), [#52](https://github.com/nicotordev/payku-sdk/issues/52), [#84](https://github.com/nicotordev/payku-sdk/issues/84) (incluye `PaykuConciliationError`).

---

## Fase 8 — DX transversal (audit CL; impacto multi-país posible)

| Issue                                                                                                              | Tema                                                            |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| [#88](https://github.com/nicotordev/payku-sdk/issues/88), [#93](https://github.com/nicotordev/payku-sdk/issues/93) | `forCountry("CL")` — currency default en banks / paymentMethods |
| [#90](https://github.com/nicotordev/payku-sdk/issues/90), [#95](https://github.com/nicotordev/payku-sdk/issues/95) | Guard si array ausente                                          |
| [#86](https://github.com/nicotordev/payku-sdk/issues/86), [#91](https://github.com/nicotordev/payku-sdk/issues/91) | Endpoints públicos vs Bearer                                    |
| [#82](https://github.com/nicotordev/payku-sdk/issues/82)                                                           | `conciliation.create` → `list` (breaking: planificar semver)    |
| [#68](https://github.com/nicotordev/payku-sdk/issues/68)                                                           | Helper URL `suscripcion/index` (pasarela CL)                    |

---

## Fase 9 — Documentación (al final de cada módulo o sprint doc)

| Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Tema                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| [#98](https://github.com/nicotordev/payku-sdk/issues/98)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Sandbox CL: tarjetas + RUT Webpay  |
| [#89](https://github.com/nicotordev/payku-sdk/issues/89)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Bancos CLP → wallet / transactions |
| [#20](https://github.com/nicotordev/payku-sdk/issues/20), [#28](https://github.com/nicotordev/payku-sdk/issues/28), [#36](https://github.com/nicotordev/payku-sdk/issues/36), [#44](https://github.com/nicotordev/payku-sdk/issues/44), [#51](https://github.com/nicotordev/payku-sdk/issues/51), [#62](https://github.com/nicotordev/payku-sdk/issues/62), [#69](https://github.com/nicotordev/payku-sdk/issues/69), [#71](https://github.com/nicotordev/payku-sdk/issues/71), [#79](https://github.com/nicotordev/payku-sdk/issues/79), [#83](https://github.com/nicotordev/payku-sdk/issues/83), [#85](https://github.com/nicotordev/payku-sdk/issues/85) | README por módulo Chile            |

---

## Resumen ejecutivo (MVP corrección P0 — Chile)

Si solo hay tiempo para **una quincena**, este es el mínimo para cerrar bugs de wire format en **CL**:

1. **Fase 0:** #97
2. **Fase 1:** #54, #55, #53
3. **Wallet CL:** #72, #74
4. **Anulación:** #22
5. **Escrow:** #16
6. **Marketplace:** #32
7. **Consumo:** #63, #67 (validar Sign en sandbox)

Total: ~12 PRs focalizados en bugs de wire format.

---

## Mantenimiento del documento

- **Solo Chile.** No sustituye roadmaps PE/VES.
- Actualizar al cerrar issues o al completar nuevos audits CL.
- Tras cada release, marcar en CHANGELOG qué fases CL quedaron cubiertas.
- No editar issues desde este archivo; usar GitHub como fuente de verdad del detalle técnico.
