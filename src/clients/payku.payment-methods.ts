import { PaykuError } from "../errors";
import type { HttpClient } from "../http/client";
import type { PaykuCurrency } from "../types/payku.common";
import type {
  PaykuListPaymentMethodsParams,
  PaykuPaymentMethod,
  PaykuPaymentMethodsResponse,
} from "../types/payku.payment-methods";
import type { PaykuPaymentMethodInput } from "../types/payku.transactions";
import {
  paymentMethodToSlug,
  resolvePaymentMethod,
} from "../utils/payku.utils";

const PAYMENT_CURRENCIES = [
  "CLP",
  "PEN",
  "VES",
] as const satisfies readonly PaykuCurrency[];

/**
 * Código numérico → slug canónico.
 * Sin `currency`, busca en CLP, PEN y VES. Si el código no existe, devuelve `undefined`.
 * Si el mismo código mapea a slugs distintos, hay que pasar `currency`.
 */
function toSlug(code: number, currency?: PaykuCurrency): string | undefined {
  if (currency !== undefined) {
    return paymentMethodToSlug(code, currency);
  }

  const slugs = new Set<string>();
  for (const candidate of PAYMENT_CURRENCIES) {
    const slug = paymentMethodToSlug(code, candidate);
    if (slug !== undefined) {
      slugs.add(slug);
    }
  }

  if (slugs.size > 1) {
    throw new PaykuError(
      `payment code ${code} maps to more than one slug; pass currency`,
    );
  }

  const [slug] = slugs;
  return slug;
}

/**
 * Slug o código → código numérico de Payku.
 * Sin `currency`, el slug tiene que existir en una sola moneda (o en varias con el mismo código).
 */
function resolve(
  payment: PaykuPaymentMethodInput | string,
  currency?: PaykuCurrency,
): number {
  if (currency !== undefined) {
    return resolvePaymentMethod(payment, currency);
  }

  if (typeof payment === "number") {
    if (!Number.isInteger(payment)) {
      throw new PaykuError(`payment ${payment} is not a valid payment code`);
    }
    return payment;
  }

  const codes = new Set<number>();
  for (const candidate of PAYMENT_CURRENCIES) {
    try {
      codes.add(resolvePaymentMethod(payment, candidate));
    } catch (error) {
      if (!(error instanceof PaykuError)) {
        throw error;
      }
    }
  }

  if (codes.size > 1) {
    throw new PaykuError(
      `payment slug "${payment}" is valid for more than one currency; pass currency`,
    );
  }

  const [code] = codes;
  if (code === undefined) {
    throw new PaykuError(`payment slug "${payment}" is not valid`);
  }

  return code;
}

/**
 * Módulo de consulta de catálogo de métodos de pago.
 *
 * `GET /api/paymentmethods` es un endpoint de catálogo público según la especificación de Payku.
 * No requiere autenticación Bearer ni firma HMAC Sign.
 */
export default class PaykuPaymentMethods {
  constructor(private readonly http: HttpClient) {}

  public list = this.listPaymentMethods.bind(this);

  /** Código numérico → slug canónico (`1` → `"webpay"`). */
  public static toSlug = toSlug;

  /** Slug o código → código numérico de Payku (`"webpay"` → `1`). */
  public static resolve = resolve;

  /** Igual que `PaykuPaymentMethods.toSlug`. */
  public toSlug = PaykuPaymentMethods.toSlug;

  /** Igual que `PaykuPaymentMethods.resolve`. */
  public resolve = PaykuPaymentMethods.resolve;

  /**
   * Lista los métodos de pago disponibles según la moneda especificada (o todos si se omite).
   *
   * @param params Parámetros de consulta opcionales (`currency`).
   * @returns Lista de entidades `PaykuPaymentMethod` (o arreglo vacío defensivo si la API omite `payment_methods`).
   */
  private async listPaymentMethods(
    params: PaykuListPaymentMethodsParams = {},
  ): Promise<PaykuPaymentMethod[]> {
    const query =
      params.currency !== undefined
        ? { currency: String(params.currency).toLowerCase() }
        : undefined;

    const response = await this.http.request<PaykuPaymentMethodsResponse>({
      method: "GET",
      path: "/paymentmethods",
      auth: false,
      query,
    });

    return Array.isArray(response?.payment_methods)
      ? response.payment_methods
      : [];
  }
}
