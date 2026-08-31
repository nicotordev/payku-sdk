export interface PaykuConciliationRequest {
  date_init: string;
  date_end: string;
  [key: string]: unknown;
}

/** Estatus documentado por Payku (incluye typo API `deteined`). */
export type PaykuConciliationStatus =
  "pending" | "paid_out" | "deteined" | "returned";

/** Transacción anidada en un ítem de conciliación. */
export interface PaykuConciliationTransaction {
  transaction_id?: string;
  payment_key?: string;
  order?: string | number;
  start?: string;
  end?: string;
  deposit_date?: string;
  /** Docs mezclan string e int en ejemplos vs tabla. */
  amount?: string | number;
  fee?: string | number;
  amount_deposit?: string | number;
  media?: string;
}

/** Ítem del array `conciliation` en `POST /api/conciliation`. */
export interface PaykuConciliationItem {
  id?: string;
  created_at?: string;
  amount_available?: number;
  amount_deposit?: number;
  status?: PaykuConciliationStatus | string;
  destiny?: string;
  currency?: string;
  wallet?: string | null;
  transaction?: PaykuConciliationTransaction[];
}

/** Response 200 de `POST /api/conciliation`. */
export interface PaykuListConciliationsResponse {
  conciliation: PaykuConciliationItem[];
}

/** @deprecated Prefer `PaykuListConciliationsResponse`. */
export type PaykuConciliationResponse = PaykuListConciliationsResponse;
