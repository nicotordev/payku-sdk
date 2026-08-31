import type { PaykuRegisterResponse } from "./payku.responses";

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

/** Interim create response; #39 splits create vs get shapes. */
export interface PaykuMallTransactionResponse extends PaykuRegisterResponse {
  [key: string]: unknown;
}
