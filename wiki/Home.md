# Payku SDK Wiki

Documentación complementaria de [`@nicotordev/payku`](https://www.npmjs.com/package/@nicotordev/payku) — SDK TypeScript open source para Payku (Chile, Perú, Venezuela).

> **Fuente de verdad del código:** [nicotordev/payku-sdk](https://github.com/nicotordev/payku-sdk)

## Empezar

| Página                                                     | Contenido                                         |
| ---------------------------------------------------------- | ------------------------------------------------- |
| [Instalación y configuración](Instalación-y-configuración) | Bun, tokens, `Payku.forCountry()`                 |
| [Chile (CL)](Chile-CL)                                     | Módulos CLP, transacciones, wallet, suscripciones |
| [Perú y Venezuela](Perú-y-Venezuela)                       | PEN, VES, On-Site VE                              |
| [Webhooks y seguridad](Webhooks-y-seguridad)               | `verifyNotify`, tokens, Sign                      |
| [Arquitectura del SDK](Arquitectura-del-SDK)               | Facade, clientes, tipos, convenciones             |
| [Roadmap Chile](Roadmap-Chile)                             | Auditoría CL, project board, milestones           |
| [Contribuir](Contribuir)                                   | PRs, tests, Codespaces                            |
| [Soporte](Soporte)                                         | Issues, Discussions, Payku Docs                   |

## Enlaces rápidos

- [npm](https://www.npmjs.com/package/@nicotordev/payku) · [Issues](https://github.com/nicotordev/payku-sdk/issues) · [Discussions](https://github.com/nicotordev/payku-sdk/discussions)
- [Project auditoría CL](https://github.com/users/nicotordev/projects/4)
- [Payku Docs oficial](https://docs.payku.com) · [Ayuda Payku](https://ayuda.payku.com)
- Especificación en repo: [`docs/sdk-spec.md`](https://github.com/nicotordev/payku-sdk/blob/main/docs/sdk-spec.md)

## Stack

- **Runtime:** [Bun](https://bun.sh) 1.4.x
- **HTTP:** axios + HMAC `Sign` en endpoints sensibles
- **Entry:** `Payku.forCountry("CL" | "PE" | "VE")` recomendado para apps de un solo mercado
