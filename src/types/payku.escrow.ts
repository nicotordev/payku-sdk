/**
 * `POST /api/escrow` — autorizar liquidación.
 * Docs: array `transactions` (IDs `trx…`), no campo singular `transaction`.
 */
export interface PaykuEscrowAuthorizeRequest {
  transactions: string[];
}

/** Estados de liquidación documentados en authorize escrow. */
export type PaykuEscrowSettlementStatus =
  | "not found"
  | "pending"
  | "liquidate"
  | "pending for deposit"
  | "paid";

export interface PaykuEscrowSettlementItem {
  /** Documentados + fallback `string` por valores futuros de Payku (#17). */
  status: PaykuEscrowSettlementStatus | string;
  transaction_id: string;
  amount: number;
  availability_date?: string;
  /** Puede ser fecha o `"N/D"`. */
  deposit_date?: string;
}

/** Respuesta 200 de `POST /api/escrow`. */
export interface PaykuEscrowAuthorizeResponse {
  transactions: PaykuEscrowSettlementItem[];
}
