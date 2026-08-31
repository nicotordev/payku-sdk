import type { PaykuRegisterResponse } from "./payku.responses";

export interface PaykuMarketplaceClientRequest {
  email?: string;
  name?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface PaykuMarketplaceAffiliationRequest {
  client?: string;
  [key: string]: unknown;
}

export interface PaykuMarketplaceTransactionRequest {
  email: string;
  order: string;
  subject: string;
  amount: number;
  payment?: number;
  urlreturn?: string;
  urlnotify?: string;
  /** Token de afiliación (`maaffiliation.token`). */
  marketplace: string;
}

export interface PaykuMarketplaceClientResponse extends PaykuRegisterResponse {
  [key: string]: unknown;
}
