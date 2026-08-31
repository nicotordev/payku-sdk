import type { HttpClient } from "../http/client";
import type {
  PaykuListPaymentMethodsParams,
  PaykuPaymentMethod,
  PaykuPaymentMethodsResponse,
} from "../types/payku.payment-methods";

export default class PaykuPaymentMethods {
  constructor(private readonly http: HttpClient) {}

  public list = this.listPaymentMethods.bind(this);

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
      query,
    });

    return response.payment_methods;
  }
}
