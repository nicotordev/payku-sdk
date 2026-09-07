import {
  PAYKU_COUNTRY_CURRENCY,
  type PaykuCountry,
} from "../types/payku.common";
import type {
  PaykuListPaymentMethodsParams,
  PaykuPaymentMethod,
} from "../types/payku.payment-methods";
import type PaykuPaymentMethods from "./payku.payment-methods";

export type PaykuScopedListPaymentMethodsParams = PaykuListPaymentMethodsParams;

/**
 * Catálogo de métodos de pago con `currency` inferida automáticamente según el país del cliente.
 */
export class PaykuScopedPaymentMethods {
  constructor(
    private readonly inner: PaykuPaymentMethods,
    private readonly country: PaykuCountry,
  ) {}

  /**
   * Lista los métodos de pago disponibles para la moneda del país.
   * Si no se especifica `currency`, utiliza por defecto la moneda correspondiente al país configurado (ej. "clp" para CL).
   */
  list(params: PaykuScopedListPaymentMethodsParams = {}): Promise<PaykuPaymentMethod[]> {
    const currency =
      params.currency ??
      (PAYKU_COUNTRY_CURRENCY[this.country].toLowerCase() as Lowercase<
        typeof PAYKU_COUNTRY_CURRENCY[typeof this.country]
      >);

    return this.inner.list({
      ...params,
      currency,
    });
  }
}
