# Validación con Zod (`@nicotordev/payku/zod`)

El SDK de Payku incluye esquemas de validación opcionales construidos con [Zod](https://zod.dev) para facilitar la integración robusta en frameworks modernos de TypeScript (Next.js, Remix, Astro, Express, Fastify, Hono, etc.).

Los esquemas están expuestos a través del subpath `@nicotordev/payku/zod`, manteniendo el core del SDK ligero y sin dependencias forzadas en runtime.

---

## 📦 Instalación

`zod` está configurado como una dependencia de pares opcional (`peerDependenciesMeta.zod.optional: true`). Si deseas utilizar los esquemas, instala `zod@^3.20.0` en tu proyecto:

```bash
# Con Bun
bun add @nicotordev/payku zod@^3.20.0

# Con pnpm
pnpm add @nicotordev/payku zod@^3.20.0

# Con npm
npm install @nicotordev/payku zod@^3.20.0
```

Si no utilizas Zod, puedes importar `@nicotordev/payku` con total normalidad; ningún archivo de Zod será incluido en tu bundle.

---

## 🧩 Esquemas disponibles

Todos los esquemas y tipos inferidos se importan desde `@nicotordev/payku/zod`:

```typescript
import {
  // Transacciones generales y Chile
  PaykuCreateTransactionSchema,
  PaykuChileCreateTransactionSchema,
  PaykuListTransactionsParamsSchema,
  createTransactionSchema,
  createChileTransactionSchema,

  // Webhooks y retornos de pasarela
  PaykuTransactionNotifySchema,
  PaykuPaymentReturnQuerySchema,
  toPaykuNotifyPayload,

  // Módulos especializados
  PaykuCreateEventSchema,
  PaykuCreateMallTransactionSchema,
  PaykuMarketplaceAffiliationSchema,

  // Re-exportación directa de Zod (opcional)
  z,
} from "@nicotordev/payku/zod";
```

---

## 🚀 Recetas de integración

### 1. Next.js App Router: Webhook Route Handler (`POST /api/webhooks/payku`)

Valida el payload entrante de la notificación `urlnotify` de Payku y verifícalo contra la API oficial para evitar fraudes, procesando los datos confirmados por la pasarela:

```typescript
// app/api/webhooks/payku/route.ts
import { NextResponse } from "next/server";
import Payku from "@nicotordev/payku";
import {
  PaykuTransactionNotifySchema,
  toPaykuNotifyPayload,
} from "@nicotordev/payku/zod";

const payku = Payku.fromEnv();

export async function POST(request: Request) {
  try {
    const rawJson = await request.json();

    // 1. Validar defensivamente el cuerpo del webhook
    const parsed = PaykuTransactionNotifySchema.safeParse(rawJson);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid webhook payload", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    // 2. Verificar autenticidad consultando la API de Payku con el helper nativo
    const verification = await payku.webhooks.verifyNotify(
      toPaykuNotifyPayload(payload),
    );

    if (!verification.valid) {
      console.warn("Webhook verification failed:", verification.reason);
      return NextResponse.json({ error: "Verification failed" }, { status: 401 });
    }

    // 3. Procesar datos verificados provistos directamente por la transacción en Payku
    const tx = verification.transaction;
    if (tx.status === "success") {
      console.log(`Pago confirmado con éxito para orden ${tx.order} (id: ${tx.id})`);
      // Actualizar pedido en base de datos con los datos seguros de la pasarela...
    } else {
      console.log(`Transacción no exitosa: estado ${tx.status} para orden ${tx.order}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error procesando webhook de Payku:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

---

### 2. Next.js Server Actions: Validación de checkout (`payku.transactions.create`)

Valida los datos de compra en el servidor antes de invocar la API de Payku para crear la orden de pago:

```typescript
// app/actions/checkout.ts
"use server";

import Payku from "@nicotordev/payku";
import { PaykuChileCreateTransactionSchema } from "@nicotordev/payku/zod";

const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
  environment: "production",
});

export async function createCheckoutSession(formData: FormData) {
  const rawInput = {
    email: formData.get("email"),
    order: formData.get("order"),
    subject: formData.get("subject"),
    amount: Number(formData.get("amount")),
    urlreturn: "https://mi-tienda.cl/checkout/return",
    urlnotify: "https://mi-tienda.cl/api/webhooks/payku",
  };

  // Validar con esquema específico para Chile (CLP)
  const validation = PaykuChileCreateTransactionSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const response = await payku.transactions.create(validation.data);
    return {
      success: true,
      redirectUrl: response.url,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Error al iniciar pago",
    };
  }
}
```

---

### 3. Hono / Express: Retorno de checkout (`GET /checkout/return`)

Cuando el cliente finaliza o cancela el flujo en la pasarela de Payku, es redirigido a `urlreturn`. Usa `PaykuPaymentReturnQuerySchema` para interpretar la query string o URL completa, normalizando `status`, `id`, `messageError` y el flag booleano `expired`:

#### Ejemplo con Express:

```typescript
import express from "express";
import { PaykuPaymentReturnQuerySchema } from "@nicotordev/payku/zod";

const app = express();

app.get("/checkout/return", (req, res) => {
  // safeParse acepta directamente el objeto req.query
  const parsed = PaykuPaymentReturnQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).send("Parámetros de retorno inválidos");
  }

  const { id, status, expired, messageError } = parsed.data;
  const safeId = encodeURIComponent(id ?? "");

  // Detecta expiración según el booleano normalizado expired
  if (expired) {
    return res.redirect(`/checkout/expired?id=${safeId}`);
  }

  if (status === "success") {
    return res.redirect(`/checkout/success?id=${safeId}`);
  }

  const safeReason = encodeURIComponent(messageError ?? status ?? "rejected");
  return res.redirect(`/checkout/failed?id=${safeId}&reason=${safeReason}`);
});
```

#### Ejemplo con Hono:

```typescript
import { Hono } from "hono";
import { PaykuPaymentReturnQuerySchema } from "@nicotordev/payku/zod";

const app = new Hono();

app.get("/checkout/return", (c) => {
  // c.req.query() devuelve Record<string, string>
  const parsed = PaykuPaymentReturnQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return c.text("Parámetros de retorno inválidos", 400);
  }

  const { id, status, expired } = parsed.data;
  const safeId = encodeURIComponent(id ?? "");

  if (expired) {
    return c.redirect(`/checkout/expired?id=${safeId}`);
  }

  const safeStatus = encodeURIComponent(status ?? "");
  return c.redirect(`/checkout/result?status=${safeStatus}&id=${safeId}`);
});
```

---

## 🛡️ Buenas prácticas recomendadas

### 1. Parseo defensivo (`safeParse` sobre `parse`)
En rutas HTTP, controladores o webhooks, prefiere siempre `.safeParse()` sobre `.parse()`. Esto evita que excepciones no controladas derriben el proceso o generen respuestas 500 no deseadas ante entradas malformadas de clientes externos.

### 2. No validar estrictamente respuestas completas de la API de Payku
Los esquemas de este paquete están configurados intencionalmente con `.passthrough()` en payloads de entrada y eventos. 
> ⚠️ **Importante:** Las pasarelas de pago y bancos intermediarios pueden agregar campos adicionales o no documentados en respuestas y webhooks (`payment_key`, `gateway_response`, metadatos bancarios). Validar respuestas de API con `.strict()` puede provocar que tu aplicación rechace o interrumpa transacciones exitosas ante cambios menores del proveedor.

### 3. Simulación de reloj en pruebas (Testing Time Travel)
La fecha `expired` de Payku exige estar al menos 5 minutos en el futuro según la hora local de Santiago de Chile (`America/Santiago`). Para escribir pruebas reproducibles, utiliza las fábricas de esquemas inyectando un reloj ficticio:

```typescript
import { createTransactionSchema } from "@nicotordev/payku/zod";

// Fija el reloj para tus tests unitarios
const fixedNow = new Date("2026-01-01T12:00:00Z");
const testSchema = createTransactionSchema({ now: fixedNow });

const result = testSchema.safeParse({
  amount: 1000,
  currency: "CLP",
  expired: "2026-01-01 10:00:00", // hora Santiago
  urlreturn: "https://example.com/return",
});
```
