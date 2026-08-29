# Payku — Cliente API para TypeScript

<p align="center">
  <img src="./public/logo.png" alt="Payku" width="120" />
</p>

<p align="center">
  SDK en TypeScript para integrar <a href="https://payku.com/about">Payku</a>, la pasarela de pagos LATAM, en aplicaciones web.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nicotordev/payku"><img src="https://img.shields.io/npm/v/@nicotordev/payku.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@nicotordev/payku"><img src="https://img.shields.io/npm/dm/@nicotordev/payku.svg" alt="NPM Downloads" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@nicotordev/payku.svg" alt="License" /></a>
  <a href="https://github.com/nicotordev/payku-sdk/actions"><img src="https://github.com/nicotordev/payku-sdk/actions/workflows/verify-build.yml/badge.svg" alt="Build" /></a>
  <img src="https://img.shields.io/badge/runtime-Bun-fbf0df?logo=bun&logoColor=000" alt="Bun" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
</p>

## Descripción

Este paquete proporciona un cliente API tipado para integrar Payku de forma sencilla y segura.

[Payku](https://payku.com/about) es una pasarela de pagos LATAM (desde 2017) orientada a comercios y emprendedores. Facilita cobros con tarjetas, billeteras digitales, links de pago, suscripciones y payouts en Chile, Perú y el resto de la región.

Con este SDK podrás trabajar con:

- **Transacciones / pagos**
- **Links de pago**
- **Suscripciones y cobros recurrentes**
- **Payouts**
- **Webhooks / confirmaciones de pago**
- **Consulta de estado de órdenes**

> Métodos de pago soportados por Payku (referencia): Webpay, Mach, tarjetas, Yape, Plin, Etpay, Floid, Fintoc, entre otros.

## Instalación

```bash
bun add @nicotordev/payku
```

```bash
npm install @nicotordev/payku
```

```bash
yarn add @nicotordev/payku
```

## Uso

### Importar y configurar el cliente

```typescript
// TODO: API pública pendiente de implementar
import Payku from "@nicotordev/payku";

const payku = new Payku(
  "tu_public_token",
  "tu_private_token",
  "sandbox", // o 'production'
);
```

### Verificar callbacks de Payku

```typescript
// TODO: ejemplo de verificación de webhook / confirmación de pago
```

## Ejemplos

> Sección placeholder — se completará a medida que avance el SDK.

### Crear una orden de pago

```typescript
// TODO
// const order = await payku.payments.create({ ... });
// console.log('URL de pago:', order.url);
```

### Consultar el estado de un pago

```typescript
// TODO
// const status = await payku.payments.status.byToken('token_de_transaccion');
```

### Crear un link de pago

```typescript
// TODO
// const link = await payku.paymentLinks.create({ ... });
```

### Crear una suscripción

```typescript
// TODO
// const subscription = await payku.subscriptions.create({ ... });
```

### Solicitar un payout

```typescript
// TODO
// const payout = await payku.payouts.create({ ... });
```

## Desarrollo

```bash
bun install
bun run build
bun test
```

## Documentación

- [Payku — sitio oficial](https://payku.com)
- [Acerca de Payku](https://payku.com/about)
- [Centro de ayuda Payku](https://ayuda.payku.com)
- Ambiente de pruebas: [des.payku.cl](https://des.payku.cl)
- Ambiente de producción: [app.payku.cl](https://app.payku.cl)

## Licencia

MIT © [Nicolas Torres](https://github.com/nicotordev)
