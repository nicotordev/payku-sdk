export interface PaykuMarketplaceClientBank {
  sbif: string;
  type: string | number;
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
  | PaykuCreateMarketplaceClientRequest
  | PaykuUpdateMarketplaceClientRequest;

export interface PaykuMarketplaceClientBankResponse {
  sbif?: string;
  rut?: string;
  type?: number | string;
  num?: string;
}

/**
 * Response create/get/update maclient (sin `url`).
 * Wire typo: `update_at`.
 */
export interface PaykuMarketplaceClientResponse {
  id?: string;
  status?: string;
  name?: string;
  phone?: string;
  email?: string;
  bank?: PaykuMarketplaceClientBankResponse;
  affiliations?: number;
  created_at?: string;
  /** Wire typo Payku: `update_at` (puede ser `"null"` string). */
  update_at?: string | null;
}

/** Respuesta 200 de `DELETE /api/maclient/{id}`. */
export interface PaykuDeleteMarketplaceClientResponse {
  status: string;
  id: string;
}

export interface PaykuMarketplaceAffiliationRequest {
  client?: string;
  [key: string]: unknown;
}

export interface PaykuMarketplaceTransactionRequest {
  email?: string;
  order?: string;
  subject?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}
