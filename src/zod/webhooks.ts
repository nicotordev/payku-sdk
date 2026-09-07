import { z } from "zod";
import type { PaykuNotifyPayload } from "../types/payku.transactions";
import type { PaykuPaymentReturnResult } from "../utils/payku.utils";

export { z };

/**
 * Normaliza inputs de query para urlreturn, aceptando URL completa,
 * query string parcial, instancia de URLSearchParams o Record de objetos (Next.js/Express).
 */
function normalizeReturnQueryInput(input: unknown): unknown {
  if (typeof input === "string") {
    let queryString = input;
    if (queryString.includes("#")) {
      queryString = queryString.slice(0, queryString.indexOf("#"));
    }
    if (queryString.includes("?")) {
      queryString = queryString.slice(queryString.indexOf("?") + 1);
    }
    const params = new URLSearchParams(queryString);
    const obj: Record<string, string> = {};
    params.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  if (
    typeof URLSearchParams !== "undefined" &&
    input instanceof URLSearchParams
  ) {
    const obj: Record<string, string> = {};
    input.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  if (typeof input === "object" && input !== null) {
    const obj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      obj[key] = Array.isArray(val) ? val[0] : val;
    }
    return obj;
  }

  return input;
}

/**
 * Esquema base crudo para notificaciones webhook (urlnotify).
 */
export const PaykuTransactionNotifyRawSchema = z
  .object({
    id: z.string().optional(),
    transaction_id: z.string().optional(),
    status: z.string().min(1, "status is required"),
    order: z.union([
      z.string().min(1, "order is required"),
      z.number().transform(String),
    ]),
    payment_key: z.string().min(1, "payment_key is required"),
    transaction_key: z.string().optional(),
    verification_key: z.string().optional(),
    verification_token: z.string().optional(),
    token: z.string().optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    currency: z.string().optional(),
    payment: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

/**
 * Esquema de validación Zod para el cuerpo POST de urlnotify (webhook de Payku).
 * Normaliza `id` / `transaction_id` y `verification_key` / `token`.
 */
export const PaykuTransactionNotifySchema =
  PaykuTransactionNotifyRawSchema.transform((data) => {
    const effectiveId = data.transaction_id ?? data.id;
    const effectiveToken =
      data.verification_key ?? data.verification_token ?? data.token;

    return {
      ...data,
      id: effectiveId,
      transaction_id: effectiveId,
      verification_key: effectiveToken,
      verification_token: effectiveToken,
      token: effectiveToken,
    };
  });

/** Tipo inferido para el payload de notificación webhook (urlnotify) */
export type PaykuTransactionNotify = z.infer<
  typeof PaykuTransactionNotifySchema
>;

/**
 * Esquema base crudo para parámetros de retorno (urlreturn).
 */
export const PaykuPaymentReturnRawQuerySchema = z
  .object({
    id: z.union([z.string(), z.number().transform(String)]).optional(),
    status: z.union([z.string(), z.number().transform(String)]).optional(),
    message_error: z.string().optional(),
    messageError: z.string().optional(),
  })
  .passthrough();

/**
 * Esquema de validación Zod para los parámetros recibidos en urlreturn.
 * Parsea y normaliza `message_error` / `messageError` e infiere el flag `expired`.
 */
export const PaykuPaymentReturnQuerySchema = z.preprocess(
  normalizeReturnQueryInput,
  PaykuPaymentReturnRawQuerySchema.transform(
    (data): PaykuPaymentReturnResult => {
      const messageError = data.message_error ?? data.messageError;
      const normalizedMessageError = messageError?.trim().toLowerCase();
      const normalizedStatus = data.status?.trim().toLowerCase();
      const expired =
        normalizedMessageError === "expired" || normalizedStatus === "expired";

      return {
        id: data.id,
        status: data.status,
        messageError,
        expired,
      };
    },
  ),
);

/** Tipo inferido para los parámetros de redirección de retorno (urlreturn) */
export type PaykuPaymentReturnQuery = z.infer<
  typeof PaykuPaymentReturnQuerySchema
>;

/**
 * Convierte un PaykuTransactionNotify validado al formato esperado por PaykuWebhooks.verifyNotify.
 */
export function toPaykuNotifyPayload(
  notify: PaykuTransactionNotify,
): PaykuNotifyPayload {
  return {
    transaction_id: notify.transaction_id ?? notify.id ?? "",
    payment_key: notify.payment_key,
    transaction_key: notify.transaction_key ?? "",
    verification_key:
      notify.verification_key ??
      notify.verification_token ??
      notify.token ??
      "",
    order: String(notify.order),
    status: notify.status === "failed" ? "failed" : "success",
  };
}
