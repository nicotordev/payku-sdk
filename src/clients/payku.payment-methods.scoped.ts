import {
  PAYKU_COUNTRY_CURRENCY,
  type PaykuCountry,
  type PaykuCurrency,
} from "../types/payku.common";
import type {
  PaykuListPaymentMethodsParams,
  PaykuPaymentMethod,
} from "../types/payku.payment-methods";
import type { PaykuPaymentMethodInput } from "../types/payku.transactions";
import { resolveScopedCurrency } from "../utils/payku.utils";
import PaykuPaymentMethods from "./payku.payment-methods";

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
  list(
    params: PaykuScopedListPaymentMethodsParams = {},
  ): Promise<PaykuPaymentMethod[]> {
    const currency = resolveScopedCurrency(this.country, params.currency);

    return this.inner.list({
      ...params,
      currency,
    });
  }

  /**
   * Código → slug de la moneda del país.
   * `currency` explícita reemplaza esa moneda.
   */
  toSlug = (code: number, currency?: PaykuCurrency): string | undefined =>
    PaykuPaymentMethods.toSlug(
      code,
      currency ?? PAYKU_COUNTRY_CURRENCY[this.country],
    );

  /**
   * Slug o código → código numérico, usando la moneda del país.
   * `currency` explícita reemplaza esa moneda.
   */
  resolve = (
    payment: PaykuPaymentMethodInput | string,
    currency?: PaykuCurrency,
  ): number =>
    PaykuPaymentMethods.resolve(
      payment,
      currency ?? PAYKU_COUNTRY_CURRENCY[this.country],
    );
}
