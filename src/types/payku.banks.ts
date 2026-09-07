import type { PaykuCurrency } from "./payku.common";
import type { PaykuSuccessResponse } from "./payku.responses";

export interface PaykuBank {
  /**
   * Código identificador del banco.
   *
   * En Chile corresponde al código SBIF (ej. `"0001"` para Banco de Chile, `"0012"` para Banco Estado).
   * Este código se utiliza en:
   * - **Wallet payout:** campo `accountbank_sbif` al solicitar liquidaciones o retiros bancarios.
   * - **Transacciones Chile:** campo opcional `payer_bank` al crear pagos con transferencias bancarias directas (Etpay, Fintoc, Floid).
   */
  code: string;
  /** Nombre comercial de la institución financiera. */
  name: string;
  /** Moneda asociada a la institución financiera. */
  currency: PaykuCurrency | string;
}

/** GET /api/banks — respuesta 200. */
export interface PaykuBanksResponse extends PaykuSuccessResponse {
  banks: PaykuBank[];
}

export interface PaykuListBanksParams {
  currency: Lowercase<PaykuCurrency> | PaykuCurrency;
}
