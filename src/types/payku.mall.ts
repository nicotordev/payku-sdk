import type { PaykuAPIError } from "../errors";

/** Tupla wire de un beneficiario Mall: [token|afiliación, amount, subject, eventId|null, individualOrder]. */
export type PaykuMallMerchantTuple = [
  tokenOrAffiliationId: string,
  amount: string | number,
  subject: string,
  eventId: string | null,
  individualOrder: string,
];

/** Objeto nombrado; el cliente lo serializa a la 5-tupla wire. `eventId` omitido se envía como `null`. */
export interface PaykuMallMerchantInput {
  tokenOrAffiliationId: string;
  amount: string | number;
  subject: string;
  eventId?: string | null;
  individualOrder: string;
}

/** Input de `merchant[]`: 5-tupla wire u objeto nombrado. */
export type PaykuMallMerchantItem =
  PaykuMallMerchantTuple | PaykuMallMerchantInput;

/** `POST /api/mall` — crear transacción Mall. */
export interface PaykuMallTransactionRequest {
  email: string;
  /** Medio de pago: 1|4|6|9|19|23|26|99 */
  payment: number;
  merchant: PaykuMallMerchantItem[];
  /** Orden del comercio (único). */
  order: number | string;
  urlreturn: string;
  urlnotify?: string;
}

/** Estados documentados de transacción Mall. */
export type PaykuMallTransactionStatus =
  "pending" | "success" | "rejected" | "refunded partial" | "refunded";

export interface PaykuMallIndividualOrder {
  merchant: string;
  amount: number | string;
  subject: string;
  event: string | null;
  identificador: string;
  individual_order: string;
}

/** `POST /api/mall` 200. */
export interface PaykuMallCreateResponse {
  status: PaykuMallTransactionStatus;
  id: string;
  individual_orders: PaykuMallIndividualOrder[];
  url: string;
}

export interface PaykuMallGetPayment {
  media?: string;
  verification_key?: string;
  authorization_code?: string;
  last_4_digits?: string;
  card_type?: string;
  currency?: string;
}

export interface PaykuMallGetMerchant {
  name: string;
  amount: number | string;
  subject: string;
}

/** `GET /api/mall/{id}` 200. */
export interface PaykuMallGetResponse {
  status: PaykuMallTransactionStatus;
  id: string;
  created_at: string;
  amount: string | number;
  payment: PaykuMallGetPayment;
  merchant: PaykuMallGetMerchant[];
}

/**
 * Payload de `urlnotify` para Mall. Docs no publican el JSON exacto;
 * el id de recurso es `mall…` (`id` o `payment_key`), no un `trx…`.
 */
export interface PaykuMallNotifyPayload {
  id?: string;
  payment_key?: string;
  verification_key?: string;
  order?: string | number;
  amount?: number | string;
  status?: string;
  [key: string]: unknown;
}

export type PaykuVerifyMallNotifyFailureReason =
  | "missing_id"
  | "id_mismatch"
  | "missing_status"
  | "status_mismatch"
  | "amount_mismatch"
  | "verification_key_mismatch"
  | "payku_api_error";

export interface PaykuVerifyMallNotifyOptions {
  expectedStatus?: string;
  expectedAmount?: number | string;
}

export type PaykuVerifyMallNotifyResult =
  | {
      valid: true;
      mall: PaykuMallGetResponse;
      notify: PaykuMallNotifyPayload;
    }
  | {
      valid: false;
      reason: PaykuVerifyMallNotifyFailureReason;
      notify: PaykuMallNotifyPayload;
      mall?: PaykuMallGetResponse;
      error?: PaykuAPIError;
    };

/** @deprecated Prefer PaykuMallCreateResponse / PaykuMallGetResponse */
export type PaykuMallTransactionResponse =
  PaykuMallCreateResponse | PaykuMallGetResponse;
