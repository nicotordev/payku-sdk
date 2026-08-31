import type { PaykuRegisterResponse } from "./payku.responses";

export interface PaykuMarketplaceClientRequest {
  email?: string;
  name?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface PaykuMarketplaceClientResponse extends PaykuRegisterResponse {
  [key: string]: unknown;
}

/** Par `[clientId, percentage]` en wire `affiliation`. */
export type PaykuMarketplaceAffiliationPair = [string, string];

/**
 * `POST /api/maaffiliation` — crear afiliación.
 */
export interface PaykuCreateMarketplaceAffiliationRequest {
  name: string;
  /** % del comercio (usuario Payku). */
  percentage: string;
  affiliation: PaykuMarketplaceAffiliationPair[];
}

/** @deprecated Preferir `PaykuCreateMarketplaceAffiliationRequest`. */
export type PaykuMarketplaceAffiliationRequest =
  PaykuCreateMarketplaceAffiliationRequest;

export interface PaykuMarketplaceAffiliationMember {
  id?: string;
  name?: string;
  percentage?: string;
}

/** Response create/get maaffiliation. */
export interface PaykuMarketplaceAffiliationResponse {
  id?: string;
  status?: string;
  name?: string;
  token?: string;
  percentage?: string;
  affiliations?: PaykuMarketplaceAffiliationMember[];
}

/** Respuesta 200 de `DELETE /api/maaffiliation/{id}`. */
export interface PaykuDeleteMarketplaceAffiliationResponse {
  status: string;
  id: string;
}

export interface PaykuMarketplaceTransactionRequest {
  email?: string;
  order?: string;
  subject?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}
