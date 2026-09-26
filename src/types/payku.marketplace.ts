import type { PaykuBankAccountTypeInput } from "./payku.wallet";

export interface PaykuMarketplaceClientBank {
  sbif: string;
  type: PaykuBankAccountTypeInput;
  num: string;
  rut: string;
}

/**
 * `POST /api/maclient` — crear cliente marketplace.
 * Requeridos: email, name, phone, bank.
 */
export interface PaykuCreateMarketplaceClientRequest {
  email: string;
  name: string;
  phone: string;
  bank: PaykuMarketplaceClientBank;
}

/**
 * `PUT /api/maclient/{id}` — update parcial (sin email en docs).
 */
export interface PaykuUpdateMarketplaceClientRequest {
  name?: string;
  phone?: string;
  bank?: Partial<PaykuMarketplaceClientBank>;
}

/** @deprecated Preferir create/update específicos. */
export type PaykuMarketplaceClientRequest =
  PaykuCreateMarketplaceClientRequest | PaykuUpdateMarketplaceClientRequest;

export interface PaykuMarketplaceClientBankResponse {
  sbif: string;
  rut: string;
  type: number | string;
  num: string;
}

/** Detalle de afiliación en response de update maclient. */
export interface PaykuMarketplaceClientAffiliationDetail {
  id: string;
  status: string;
  token: string;
  name: string;
  percentage_affiliation: number | string;
  percentage_client: number | string;
}

/**
 * Response create/get maclient (sin `url`).
 * Wire typo: `update_at`.
 */
export interface PaykuMarketplaceClientResponse {
  id: string;
  status: string;
  name: string;
  phone: string;
  email: string;
  bank: PaykuMarketplaceClientBankResponse;
  affiliations: number;
  created_at: string;
  /** Wire typo Payku: `update_at` (puede ser `"null"` string). */
  update_at: string | null;
}

/**
 * Response `PUT /api/maclient/{id}` — incluye `affiliations_details`.
 * Docs muestran un array anidado de objetos de afiliación.
 */
export interface PaykuUpdateMarketplaceClientResponse extends Omit<
  PaykuMarketplaceClientResponse,
  "created_at" | "update_at"
> {
  created_at?: string;
  update_at?: string | null;
  affiliations_details?: PaykuMarketplaceClientAffiliationDetail[][];
}

/** Respuesta 200 de `DELETE /api/maclient/{id}`. */
export interface PaykuDeleteMarketplaceClientResponse {
  status: string;
  id: string;
}

/** Response genérica interim para endpoints marketplace aún no tipados. */
export type PaykuMarketplaceUntypedResponse = Record<string, unknown>;

/** Par `[clientId, percentage]` en wire `affiliation`. */
export type PaykuMarketplaceAffiliationPair = [
  clientId: string,
  percentage: string,
];

/** Objeto nombrado; el cliente lo serializa a tupla wire. */
export interface PaykuMarketplaceAffiliationMemberInput {
  clientId: string;
  percentage: string | number;
}

/**
 * Input de `affiliation[]`: tupla wire o `{ clientId, percentage }`.
 * `percentage` en tupla puede ser number; el wire siempre es string.
 */
export type PaykuMarketplaceAffiliationInput =
  | readonly [clientId: string, percentage: string | number]
  | PaykuMarketplaceAffiliationMemberInput;

/**
 * `POST /api/maaffiliation` — crear afiliación.
 */
export interface PaykuCreateMarketplaceAffiliationRequest {
  name: string;
  /** % del comercio (usuario Payku). */
  percentage: string | number;
  affiliation: PaykuMarketplaceAffiliationInput[];
}

/** @deprecated Preferir `PaykuCreateMarketplaceAffiliationRequest`. */
export type PaykuMarketplaceAffiliationRequest =
  PaykuCreateMarketplaceAffiliationRequest;

export interface PaykuMarketplaceAffiliationMember {
  id: string;
  name: string;
  percentage: string;
}

/** Response create/get maaffiliation (200). */
export interface PaykuMarketplaceAffiliationResponse {
  id: string;
  status: string;
  name: string;
  token: string;
  percentage: string;
  affiliations: PaykuMarketplaceAffiliationMember[];
}

/** Respuesta 200 de `DELETE /api/maaffiliation/{id}`. */
export interface PaykuDeleteMarketplaceAffiliationResponse {
  status: string;
  id: string;
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
