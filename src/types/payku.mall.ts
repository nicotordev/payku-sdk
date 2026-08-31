import type { PaykuRegisterResponse } from "./payku.responses";

export interface PaykuMallTransactionRequest {
  order?: string;
  subject?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}

/** Estados documentados de transacción Mall. */
export type PaykuMallTransactionStatus =
  | "pending"
  | "success"
  | "rejected"
  | "refunded partial"
  | "refunded";

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
  status: PaykuMallTransactionStatus | string;
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
  status: PaykuMallTransactionStatus | string;
  id: string;
  created_at: string;
  amount: string | number;
  payment: PaykuMallGetPayment;
  merchant: PaykuMallGetMerchant[];
}

/** @deprecated Prefer PaykuMallCreateResponse / PaykuMallGetResponse */
export type PaykuMallTransactionResponse =
  | PaykuMallCreateResponse
  | PaykuMallGetResponse
  | (PaykuRegisterResponse & Record<string, unknown>);
