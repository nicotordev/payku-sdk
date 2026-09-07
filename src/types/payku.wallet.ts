import type { PaykuCurrency, PaykuPaginationParams } from "./payku.common";
import type { PaykuSuccessResponse } from "./payku.responses";

/**
 * Tipo de cuenta bancaria para payouts en Payku Wallet:
 * - `1`: Cuenta Corriente
 * - `2`: Cuenta Vista / Cuenta RUT
 * - `3`: Cuenta de Ahorro
 */
export type PaykuWalletAccountBankType = "1" | "2" | "3" | (string & {});

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
  accountbank_type: PaykuWalletAccountBankType;
  /**
   * Número de cuenta bancaria.
   * Para Banco Estado (SBIF `0012`), el máximo es 12 dígitos (evita ingresar tarjeta de débito).
   */
  accountbank_num: string;
  url_notify?: string;
  /**
   * Orden externa opcional (docs la listan top-level o en additional_parameters).
   */
  order_ext?: string;
  additional_parameters?: Record<string, unknown> & {
    order_ext?: string;
  };
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
  /** Wire typo Payku: `update_at` (docs también escriben “moviminto”). */
  update_at?: string;
}

export interface PaykuWalletMovement {
  id?: string;
  order?: string;
  subject?: string;
  created_at?: string;
  income_expense?: string;
  /** Docs Payku: “Estatus del moviminto” (typo en documentación). */
  status?: string;
  amount?: string | number;
  actual_amount?: string | number;
  origin_liquidation?: string | null;
  currency?: PaykuCurrency | string;
  payout?: PaykuWalletMovementPayout;
}

/** `filter` en responses de balance / list / movement get. */
export interface PaykuWalletFilter {
  page?: number;
  per_page?: number;
  currency?: PaykuCurrency | string;
  id?: string;
}

export interface PaykuWalletBalanceResponse extends PaykuSuccessResponse {
  current_id?: string;
  amount_available?: number;
  currency?: PaykuCurrency | string;
  filter?: PaykuWalletFilter;
  wallet_movements?: PaykuWalletMovement[];
}

export interface PaykuWalletListParams extends PaykuPaginationParams {
  currency?: PaykuCurrency | string;
}

/**
 * Shape compartido por `GET /wallet`, `/wallet/list` y `/wallet/{id}`.
 */
export interface PaykuWalletListResponse extends PaykuSuccessResponse {
  current_id?: string;
  amount_available?: number;
  currency?: PaykuCurrency | string;
  filter?: PaykuWalletFilter;
  wallet_movements?: PaykuWalletMovement[];
}

/** Estados documentados de payout GET / payoutv3. */
export type PaykuPayoutStatus =
  | "pending"
  | "processing"
  | "success"
  | "banking_error"
  | "fraud_prevention";

/**
 * Detalle anidado en `GET /api/payout/{id}` y `GET /api/payoutv3/{id}`.
 * Wire typo: `update_at` (no `updated_at`).
 */
export interface PaykuPayoutDetail {
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
  status?: PaykuPayoutStatus;
  /** Wire typo Payku: `update_at`. */
  update_at?: string;
  origin_wallet?: string;
}

/** Respuesta 200 de `GET /api/payout/{id}`. */
export interface PaykuGetPayoutResponse {
  payout: PaykuPayoutDetail;
}

/**
 * Detalle v3: incluye `reason_rejection` cuando el payout fue rechazado.
 */
export interface PaykuPayoutDetailV3 extends PaykuPayoutDetail {
  reason_rejection?: string;
}

/** Respuesta 200 de `GET /api/payoutv3/{id}`. */
export interface PaykuGetPayoutV3Response {
  payout: PaykuPayoutDetailV3;
}

/** Cliente / destinatario en el callback de payout. */
export interface PaykuPayoutCustomer {
  name?: string;
  phone?: string;
  document?: string;
  number?: string;
}

/**
 * Payload enviado por Payku al endpoint `url_notify` configurado en el payout.
 * Nota: Es distinto al webhook `urlnotify` de transacciones estándar.
 */
export interface PaykuPayoutNotifyPayload {
  id: string;
  identifier_payout?: string;
  order: string;
  status: PaykuPayoutStatus | string;
  /** Wire typo Payku: `update_at`. */
  update_at?: string;
  customer?: PaykuPayoutCustomer;
  [key: string]: unknown;
}

export type PaykuVerifyPayoutNotifyFailureReason =
  | "missing_id"
  | "status_mismatch"
  | "order_mismatch"
  | "payku_api_error";

export interface PaykuVerifyPayoutNotifyOptions {
  /**
   * Si es `true`, reconsulta `GET /api/payoutv3/{id}` (que incluye `reason_rejection`).
   * Por defecto usa `GET /api/payout/{id}`.
   */
  useV3?: boolean;
  expectedOrder?: string;
  expectedStatus?: PaykuPayoutStatus | string;
}

export type PaykuVerifyPayoutNotifyResult =
  | {
      valid: true;
      payout: PaykuPayoutDetail | PaykuPayoutDetailV3;
      notify: PaykuPayoutNotifyPayload;
    }
  | {
      valid: false;
      reason: PaykuVerifyPayoutNotifyFailureReason;
      notify?: PaykuPayoutNotifyPayload;
      payout?: PaykuPayoutDetail | PaykuPayoutDetailV3;
      error?: unknown;
    };

/**
 * Montos especiales para ambiente de prueba (sandbox / desarrollo: `des.payku.cl`):
 * - Montos 1000, 2000, 3000: Se marcan automáticamente como **aprobados** (`success`).
 * - Montos 1500, 2500, 3500: Se marcan automáticamente como **rechazados** (`banking_error`).
 */
export const PAYKU_WALLET_SANDBOX_AMOUNTS = {
  APPROVED: [1000, 2000, 3000] as const,
  REJECTED: [1500, 2500, 3500] as const,
} as const;

/**
 * Forma plana de callback `url_notify` (no es la response de GET).
 * @deprecated Preferir `PaykuPayoutNotifyPayload` para el callback o `PaykuGetPayoutResponse` para GET payout.
 */
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

