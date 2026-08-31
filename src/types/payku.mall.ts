import type { PaykuRegisterResponse } from "./payku.responses";

export interface PaykuMallTransactionRequest {
  order?: string;
  subject?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface PaykuMallTransactionResponse extends PaykuRegisterResponse {
  [key: string]: unknown;
}
