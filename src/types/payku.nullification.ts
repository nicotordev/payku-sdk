import type { PaykuAPIError } from "../errors";
import type { PaykuNullifyStatus } from "./payku.responses";

/**
 * `POST /api/nullification` — crear anulación.
 * Docs: `id` (trx), `amount`, `subject` (no existe campo `transaction`).
 */
export interface PaykuNullificationCreateRequest {
  id: string;
  amount: number;
  subject: string;
}

/** Tipo de anulación documentado: total | partial. */
export type PaykuNullifyType = "total" | "partial";

export interface PaykuNullifyPayment {
  gateway?: string;
  payment_type?: string;
}

/** Objeto `nullify` compartido por create/get. */
export interface PaykuNullifyDetail {
  id?: string;
  amount?: number;
  currency?: string;
  type?: PaykuNullifyType;
  status_nullify?: PaykuNullifyStatus;
  payment?: PaykuNullifyPayment;
  created_at?: string;
  updated_at?: string;
}

export interface PaykuNullifyGatewayResponse {
  status?: string;
  message?: string;
  notify?: string;
}

/** Respuesta 200 de `POST /api/nullification`. */
export interface PaykuCreateNullificationResponse {
  status: string;
  nullify: PaykuNullifyDetail;
  gateway_response?: PaykuNullifyGatewayResponse;
}

/**
 * Respuesta 200 de `GET /api/nullification/{id}`.
 * Docs: solo `{ nullify }` (sin `status` top-level ni `gateway_response`).
 */
export interface PaykuGetNullificationResponse {
  nullify: PaykuNullifyDetail;
}

/** @deprecated Preferir `PaykuCreateNullificationResponse` / `PaykuGetNullificationResponse`. */
export type PaykuNullificationResponse =
  | PaykuCreateNullificationResponse
  | PaykuGetNullificationResponse;

/**
 * Payload enviado por Payku al endpoint o webhook de callback de anulación.
 * Nota: Es independiente del callback `urlnotify` de transacciones estándar.
 */
export interface PaykuNullificationCallbackPayload {
  id: string;
  id_transaction?: string;
  ordencompra?: string;
  fecha?: string;
  monto: number;
  status: string;
  [key: string]: unknown;
}

export type PaykuVerifyNullificationCallbackFailureReason =
  | "missing_id"
  | "id_mismatch"
  | "missing_status"
  | "status_mismatch"
  | "amount_mismatch"
  | "payku_api_error";

export interface PaykuVerifyNullificationCallbackOptions {
  expectedStatus?: string;
  expectedAmount?: number;
}

export type PaykuVerifyNullificationCallbackResult =
  | {
      valid: true;
      nullify: PaykuNullifyDetail;
      callback: PaykuNullificationCallbackPayload;
    }
  | {
      valid: false;
      reason: PaykuVerifyNullificationCallbackFailureReason;
      callback: PaykuNullificationCallbackPayload;
      nullify?: PaykuNullifyDetail;
      error?: PaykuAPIError;
    };
