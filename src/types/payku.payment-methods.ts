import type { PaykuCurrency } from "./payku.common";
import type { PaykuSuccessResponse } from "./payku.responses";

export interface PaykuPaymentMethod {
  payment: number;
  currency: PaykuCurrency | string;
  name: string;
  description: string;
}

/** GET /api/paymentmethods — respuesta 200. */
export interface PaykuPaymentMethodsResponse extends PaykuSuccessResponse {
  payment_methods: PaykuPaymentMethod[];
}

export interface PaykuListPaymentMethodsParams {
  currency?: Lowercase<PaykuCurrency> | PaykuCurrency;
}
