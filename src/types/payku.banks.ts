import type { PaykuCurrency } from "./payku.common";
import type { PaykuSuccessResponse } from "./payku.responses";

export interface PaykuBank {
  code: string;
  name: string;
  currency: PaykuCurrency | string;
}

/** GET /api/banks — respuesta 200. */
export interface PaykuBanksResponse extends PaykuSuccessResponse {
  banks: PaykuBank[];
}

export interface PaykuListBanksParams {
  currency: Lowercase<PaykuCurrency> | PaykuCurrency;
}
