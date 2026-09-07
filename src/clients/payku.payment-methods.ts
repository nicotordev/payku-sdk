import type { HttpClient } from "../http/client";
import type {
  PaykuListPaymentMethodsParams,
  PaykuPaymentMethod,
  PaykuPaymentMethodsResponse,
} from "../types/payku.payment-methods";

/**
 * Módulo de consulta de catálogo de métodos de pago.
 *
 * `GET /api/paymentmethods` es un endpoint de catálogo público según la especificación de Payku.
 * No requiere autenticación Bearer ni firma HMAC Sign.
 */
export default class PaykuPaymentMethods {
  constructor(private readonly http: HttpClient) {}

  public list = this.listPaymentMethods.bind(this);

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
