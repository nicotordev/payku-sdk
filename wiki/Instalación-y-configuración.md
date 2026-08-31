# Instalación y configuración

## Instalación

```bash
bun add @nicotordev/payku
```

## Tokens

Obtén **token público** y **privado** desde el panel Payku de tu comercio. Nunca los commitees ni los pegues en issues.

Variables de entorno (Bun carga `.env` automáticamente):

```bash
PAYKU_PUBLIC_TOKEN=...
PAYKU_PRIVATE_TOKEN=...
PAYKU_ENVIRONMENT=sandbox   # o production
```

Copia `.env.example` del repo como plantilla.

## Por país (recomendado)

```typescript
import Payku from "@nicotordev/payku";

const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "sandbox",
});

// Desde .env
const fromEnv = Payku.fromEnvForCountry("CL");
```

| País | Cliente          | Moneda | Notas                                               |
| ---- | ---------------- | ------ | --------------------------------------------------- |
| `CL` | `PaykuChile`     | CLP    | Suscripciones, marketplace, mall, escrow, withdraw… |
| `PE` | `PaykuPeru`      | PEN    | Core compartido                                     |
| `VE` | `PaykuVenezuela` | VES    | `transactions.confirmOnSite`                        |

Si llamas un módulo no soportado en ese país, el SDK lanza `PaykuUnsupportedFeatureError`.

## Modo global

```typescript
const payku = new Payku(publicToken, privateToken, "production");
// o Payku.fromEnv()
```

En modo global debes pasar `currency: "CLP" | "PEN" | "VES"` en cada request.

## Entornos Payku

| SDK `environment` | Chile                   |
| ----------------- | ----------------------- |
| `sandbox`         | `https://des.payku.cl/` |
| `production`      | `https://app.payku.cl/` |

Perú y Venezuela comparten la misma base URL documentada por Payku.

## Verificación local

```bash
bun run lint
bun run build
bun run test:unit
```

Integración (opcional, requiere tokens sandbox):

```bash
PAYKU_RUN_INTEGRATION_TESTS=true bun run test:integration
```
