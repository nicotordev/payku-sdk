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
