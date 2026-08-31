/** Estados de transacción documentados por Payku. */
export type PaykuTransactionStatus =
  "register" | "pending" | "success" | "rejected";

/** Estados del gateway en respuestas de detalle de transacción. */
export type PaykuGatewayStatus =
  "pending" | "success" | "rejected" | "refunded partial" | "refunded";

/** Estados de anulación documentados por Payku. */
export type PaykuNullifyStatus =
  | "pending"
  | "awaiting_funds"
  | "waiting_bank_details"
  | "complete"
  | "reverse_deleted"
  | "reverse_completed";

/** Tipos de error HTTP frecuentes en la API. */
export type PaykuErrorType =
  "Unauthorized" | "Unprocessable Entity" | "Not Found" | (string & {});

/** 401 — token público inválido o ausente. */
export interface PaykuUnauthorizedResponse {
  type: "Unauthorized";
  message_error: PaykuUnauthorizedMessageError;
}

export type PaykuUnauthorizedMessageError =
  | string
  | {
      error?: string;
      [key: string]: unknown;
    };

/** 400/404 — respuesta de negocio con `status: failed`. */
export interface PaykuFailedResponse {
  status: "failed";
  type?: PaykuErrorType;
  message_error?: PaykuMessageError;
  id?: string;
}

export type PaykuMessageError = string | Record<string, unknown>;

/** Envelope genérico de éxito cuando la API lo incluye. */
export interface PaykuSuccessResponse {
  status: "success";
}

export type PaykuApiErrorResponse =
  PaykuFailedResponse | PaykuUnauthorizedResponse;

/**
 * Type guard para respuestas de negocio Payku con `{ status: "failed", … }`.
 * Útil al inspeccionar JSON crudo de respuestas API (proxy, logs) sin pasar por
 * `HttpClient`. No uses el body de `urlnotify` como fuente de verdad del pago:
 * valida con `payku.webhooks.verifyNotify()`.
 */
export function isPaykuFailedResponse(
  data: unknown,
): data is PaykuFailedResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as PaykuFailedResponse).status === "failed"
  );
}

/**
 * Type guard para respuestas `{ type: "Unauthorized", message_error }`.
 * Exige `message_error` string u objeto no nulo para coincidir con el tipo.
 */
export function isPaykuUnauthorizedResponse(
  data: unknown,
): data is PaykuUnauthorizedResponse {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const payload = data as Record<string, unknown>;
  if (payload.type !== "Unauthorized") {
    return false;
  }

  const messageError = payload.message_error;
  return (
    typeof messageError === "string" ||
    (typeof messageError === "object" && messageError !== null)
  );
}

/** Respuesta genérica con id y url usada en varios módulos. */
export interface PaykuRegisterResponse {
  status: "register" | "success" | "pending" | string;
  id: string;
  url?: string;
}
