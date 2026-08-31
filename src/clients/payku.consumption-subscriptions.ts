import {
  createPaykuAPIError,
  PaykuSubscriptionsError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import { bodyAsRecord } from "../utils/payku.utils";
import type {
  PaykuCreateSubscriptionRequest,
  PaykuCreateSubscriptionTransactionRequest,
  PaykuCreateSubscriptionTransactionResponse,
  PaykuDeleteCardRequest,
  PaykuSubscriptionClientRequest,
} from "../types/payku.subscriptions";

/** Endpoints de suscripción de consumo (Chile) con trailing slash. */
export default class PaykuConsumptionSubscriptions {
  public clients = {
    create: (params: PaykuSubscriptionClientRequest) =>
      this.post(
        "/suclient/",
        bodyAsRecord(params),
        "consumption.clients.create",
      ),
  };

  public plans = {
    create: (params: Record<string, unknown>) =>
      this.post("/suplan/", params, "consumption.plans.create"),
  };

  public subscriptions = {
    create: (params: PaykuCreateSubscriptionRequest) =>
      this.post(
        "/sususcription/",
        bodyAsRecord(params),
        "consumption.subscriptions.create",
      ),
  };

  public transactions = {
    create: (
      params: PaykuCreateSubscriptionTransactionRequest,
    ): Promise<PaykuCreateSubscriptionTransactionResponse> =>
      this.post(
        "/sutransaction/",
        bodyAsRecord(params),
        "consumption.transactions.create",
      ),
  };

  public cards = {
    delete: (params: PaykuDeleteCardRequest) =>
      this.post(
        "/suscriptionsdeletecards/",
        bodyAsRecord(params),
        "consumption.cards.delete",
      ),
  };

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private post<T>(
    path: string,
    params: Record<string, unknown>,
    operation: string,
  ): Promise<T> {
    return this.http
      .request<T>({
        method: "POST",
        path,
        body: params,
        signed: true,
      })
      .catch((error) => {
        throw createPaykuAPIError(
          error,
          operation,
          PaykuSubscriptionsError,
          this.options,
        );
      });
  }
}
