/**
 * `POST /api/escrow` — autorizar liquidación.
 * Docs: array `transactions` (IDs `trx…`), no campo singular `transaction`.
 */
export interface PaykuEscrowAuthorizeRequest {
  transactions: string[];
}

export interface PaykuEscrowAuthorizeResponse {
  status?: string;
  [key: string]: unknown;
}
