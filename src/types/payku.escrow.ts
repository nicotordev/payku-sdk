export interface PaykuEscrowAuthorizeRequest {
  transaction?: string;
  [key: string]: unknown;
}

/** Estados de liquidación documentados en authorize escrow. */
export type PaykuEscrowSettlementStatus =
  | "not found"
  | "pending"
  | "liquidate"
  | "pending for deposit"
  | "paid";

export interface PaykuEscrowSettlementItem {
  status: PaykuEscrowSettlementStatus;
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
