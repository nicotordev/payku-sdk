/** Tupla wire de un beneficiario Mall: [token|afiliación, amount, subject, eventId|null, individualOrder]. */
export type PaykuMallMerchantTuple = [
  tokenOrAffiliationId: string,
  amount: string | number,
  subject: string,
  eventId: string | null,
  individualOrder: string,
];

/** `POST /api/mall` — crear transacción Mall. */
export interface PaykuMallTransactionRequest {
  email: string;
  /** Medio de pago: 1|4|6|9|19|23|26|99 */
  payment: number;
  merchant: PaykuMallMerchantTuple[];
  /** Orden del comercio (único). */
  order: number | string;
  urlreturn: string;
  urlnotify?: string;
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

/** @deprecated Prefer PaykuMallCreateResponse / PaykuMallGetResponse */
export type PaykuMallTransactionResponse =
  | PaykuMallCreateResponse
  | PaykuMallGetResponse;
