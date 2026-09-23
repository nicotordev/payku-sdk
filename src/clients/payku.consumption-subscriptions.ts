import {
  createPaykuAPIError,
  PaykuSubscriptionsError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  buildConsumptionGatewayUrl,
  normalizeConsumptionPlanRequest,
  normalizeSubscriptionTransactionRequest,
  validateCreateSubscriptionTransactionRequest,
} from "../utils/payku.utils";
import type {
  PaykuConsumptionGatewayUrlParams,
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
    create: async (
      params: PaykuCreateConsumptionPlanRequest,
    ): Promise<PaykuCreateConsumptionPlanResponse> => {
      try {
        const body = normalizeConsumptionPlanRequest(params);
        return await this.post<PaykuCreateConsumptionPlanResponse>(
          "/suplan/",
          bodyAsRecord(body),
          "consumption.plans.create",
        );
      } catch (error) {
        throw createPaykuAPIError(
          error,
          "consumption.plans.create",
          PaykuSubscriptionsError,
          this.options,
        );
      }
    },
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
    create: async (
      params: PaykuCreateConsumptionTransactionRequest,
    ): Promise<PaykuCreateSubscriptionTransactionResponse> => {
      try {
        const body = normalizeSubscriptionTransactionRequest(params);
        validateCreateSubscriptionTransactionRequest(body);
        return await this.post<PaykuCreateSubscriptionTransactionResponse>(
          "/sutransaction/",
          bodyAsRecord(body),
          "consumption.transactions.create",
        );
      } catch (error) {
        throw createPaykuAPIError(
          error,
          "consumption.transactions.create",
          PaykuSubscriptionsError,
          this.options,
        );
      }
    },
  };

  /**
   * URL de pasarela Webpay `GET {rootUrl}/suscripcion/index`.
   * No llama a la API. `rootUrl` sale del cliente (`des.payku.cl` / `app.payku.cl`).
   */
  public buildGatewayUrl(params: PaykuConsumptionGatewayUrlParams): string {
    return buildConsumptionGatewayUrl({
      ...params,
      rootUrl: this.http.rootUrl,
    });
  }

  /** Alias de `buildGatewayUrl`. */
  public gatewayUrl(params: PaykuConsumptionGatewayUrlParams): string {
    return this.buildGatewayUrl(params);
  }

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
