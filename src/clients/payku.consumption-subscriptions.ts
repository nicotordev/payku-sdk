import {
  createPaykuAPIError,
  PaykuSubscriptionsError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import { bodyAsRecord } from "../utils/payku.utils";
import type {
  PaykuCreateConsumptionPlanRequest,
  PaykuCreateConsumptionPlanResponse,
  PaykuCreateSubscriptionClientRequest,
  PaykuCreateSubscriptionRequest,
  PaykuCreateSubscriptionResponse,
  PaykuCreateConsumptionTransactionRequest,
  PaykuCreateSubscriptionTransactionResponse,
  PaykuDeleteCardRequest,
  PaykuDeleteCardResponse,
  PaykuSubscriptionClientResponse,
} from "../types/payku.subscriptions";

/**
 * Suscripción de consumo (Chile): paths **con** trailing slash (`/suclient/`, …).
 *
 * `HttpClient` firma con `signPath = /api${path}` → p. ej. `/api/suplan/`.
 * Sandbox valida la firma con el slash final cuando la URL usa `/suplan/`.
 * La suscripción regular usa paths sin slash (`/suclient`, `/sutransaction`, …).
 */
export default class PaykuConsumptionSubscriptions {
  public clients = {
    create: (
      params: PaykuCreateSubscriptionClientRequest,
    ): Promise<PaykuSubscriptionClientResponse> =>
      this.post<PaykuSubscriptionClientResponse>(
        "/suclient/",
        bodyAsRecord(params),
        "consumption.clients.create",
      ),
  };

  public plans = {
    create: (
      params: PaykuCreateConsumptionPlanRequest,
    ): Promise<PaykuCreateConsumptionPlanResponse> =>
      this.post<PaykuCreateConsumptionPlanResponse>(
        "/suplan/",
        bodyAsRecord(params),
        "consumption.plans.create",
      ),
  };

  public subscriptions = {
    create: (
      params: PaykuCreateSubscriptionRequest,
    ): Promise<PaykuCreateSubscriptionResponse> =>
      this.post<PaykuCreateSubscriptionResponse>(
        "/sususcription/",
        bodyAsRecord(params),
        "consumption.subscriptions.create",
      ),
  };

  public transactions = {
    create: (
      params: PaykuCreateConsumptionTransactionRequest,
    ): Promise<PaykuCreateSubscriptionTransactionResponse> =>
      this.post<PaykuCreateSubscriptionTransactionResponse>(
        "/sutransaction/",
        bodyAsRecord(params),
        "consumption.transactions.create",
      ),
  };

  public cards = {
    delete: (
      params: PaykuDeleteCardRequest,
    ): Promise<PaykuDeleteCardResponse> =>
      this.post<PaykuDeleteCardResponse>(
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
