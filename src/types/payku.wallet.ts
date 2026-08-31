import type { PaykuCurrency, PaykuPaginationParams } from "./payku.common";
import type { PaykuSuccessResponse } from "./payku.responses";

export interface PaykuWalletPayoutRequest {
  email: string;
  phone?: string;
  subject: string;
  currency: PaykuCurrency | string;
  order: string;
  amount: number;
  accountbank_name: string;
  accountbank_rut: string;
  accountbank_sbif: string;
  accountbank_type: string;
  accountbank_num: string;
  url_notify?: string;
  additional_parameters?: Record<string, unknown>;
}

export interface PaykuWalletWithdrawRequest {
  subject: string;
  currency: PaykuCurrency | string;
  order: string;
  amount: number;
}

/** Respuesta 200 de `POST /api/wallet/withdraw` (retiro a cuenta del comercio). */
export interface PaykuCreateWalletWithdrawResponse {
  status: string;
  identifier_wallet: string;
}

/** @deprecated Preferir `PaykuCreateWalletWithdrawResponse`. */
export type PaykuWalletWithdrawCreateResponse =
  PaykuCreateWalletWithdrawResponse;

export interface PaykuWalletMovementPayout {
  id?: string;
  phone?: string;
  email?: string;
  subject?: string;
  amount?: string | number;
  accountbank_rut?: string;
  accountbank_name?: string;
  accountbank_type?: number | string;
  accountbank_num?: number | string;
  accountbank_sbif?: string;
  status?: string;
  update_at?: string;
}

export interface PaykuWalletMovement {
  id?: string;
  order?: string;
  subject?: string;
  created_at?: string;
  income_expense?: string;
  status?: string;
  amount?: string | number;
  actual_amount?: string | number;
  origin_liquidation?: string | null;
  currency?: PaykuCurrency | string;
  payout?: PaykuWalletMovementPayout;
}

export interface PaykuWalletBalanceResponse extends PaykuSuccessResponse {
  current_id?: string;
  amount_available?: number;
  currency?: PaykuCurrency | string;
  filter?: Record<string, unknown>;
  wallet_movements?: PaykuWalletMovement[];
}

export interface PaykuWalletListParams extends PaykuPaginationParams {
  currency?: PaykuCurrency | string;
}

export interface PaykuWalletListResponse extends PaykuSuccessResponse {
  wallet_movements?: PaykuWalletMovement[];
  [key: string]: unknown;
}

export interface PaykuPayoutResponse {
  status?: string;
  id?: string;
  identifier_payout?: string;
  order?: string;
  update_at?: string;
  customer?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Respuesta 200 de `POST /api/wallet/payout` (pago a terceros). */
export interface PaykuCreateWalletPayoutResponse {
  status: string;
  identifier_wallet: string;
  identifier_payout: string;
}

/** @deprecated Preferir `PaykuCreateWalletPayoutResponse`. */
export type PaykuWalletPayoutCreateResponse = PaykuCreateWalletPayoutResponse;
