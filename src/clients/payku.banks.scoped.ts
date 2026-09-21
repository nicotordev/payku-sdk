import type { PaykuCountry } from "../types/payku.common";
import type { PaykuBank, PaykuListBanksParams } from "../types/payku.banks";
import { resolveScopedCurrency } from "../utils/payku.utils";
import type PaykuBanks from "./payku.banks";

export type PaykuScopedListBanksParams = Partial<PaykuListBanksParams>;

/**
 * Catálogo de bancos con `currency` inferida automáticamente según el país del cliente.
 */
export class PaykuScopedBanks {
  constructor(
    private readonly inner: PaykuBanks,
    private readonly country: PaykuCountry,
  ) {}

  /**
   * Lista los bancos disponibles para la moneda del país.
   * Si no se especifica `currency`, utiliza por defecto la moneda correspondiente al país configurado (ej. "clp" para CL).
   */
  list(params: PaykuScopedListBanksParams = {}): Promise<PaykuBank[]> {
    const currency = resolveScopedCurrency(this.country, params.currency);

    return this.inner.list({
      ...params,
      currency,
    });
  }
}
