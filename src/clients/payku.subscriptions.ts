import { Buffer } from "node:buffer";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  createPaykuAPIError,
  PaykuAPIError,
  PaykuSubscriptionsError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  mapNotifyStatusToTransactionStatus,
  validateCreateSubscriptionClientRequest,
  validateCreateSubscriptionRequest,
  validateCreateSubscriptionTransactionRequest,
  validateListSubscriptionClientsParams,
} from "../utils/payku.utils";
import type {
  PaykuCreateSubscriptionClientRequest,
  PaykuCreateSubscriptionRequest,
  PaykuCreateSubscriptionResponse,
  PaykuCreateSubscriptionTransactionRequest,
  PaykuCreateSubscriptionTransactionResponse,
  PaykuDeleteCardRequest,
  PaykuDeleteCardResponse,
  PaykuDeleteSubscriptionClientResponse,
  PaykuDeleteSubscriptionResponse,
  PaykuGetSubscriptionPlanResponse,
  PaykuGetSubscriptionResponse,
  PaykuListSubscriptionClientsParams,
  PaykuListSubscriptionClientsResponse,
  PaykuListSubscriptionPlansResponse,
  PaykuListSubscriptionsQuery,
  PaykuListSubscriptionsResponse,
  PaykuListSubscriptionsV3Query,
  PaykuListSubscriptionsV3Response,
  PaykuRegisterCardRequest,
  PaykuRegisterCardResponse,
  PaykuSubscriptionActivationNotifyPayload,
  PaykuSubscriptionClientResponse,
  PaykuSubscriptionDetailTransaction,
  PaykuSubscriptionPaymentNotifyPayload,
  PaykuUpdateSubscriptionClientRequest,
  PaykuVerifySubscriptionActivationNotifyOptions,
  PaykuVerifySubscriptionActivationNotifyResult,
  PaykuVerifySubscriptionPaymentNotifyOptions,
  PaykuVerifySubscriptionPaymentNotifyResult,
} from "../types/payku.subscriptions";

const verificationCompareKey = randomBytes(32);

function nonEmptyString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = String(value).trim();
  return trimmed === "" ? undefined : trimmed;
}

function hmacSha256(value: string): Buffer {
  return createHmac("sha256", verificationCompareKey)
    .update(value, "utf8")
    .digest();
}

function verificationKeysEqual(left: string, right: string): boolean {
  return timingSafeEqual(hmacSha256(left), hmacSha256(right));
}

export default class PaykuSubscriptions {
  public clients = {
    create: this.createClient.bind(this),
    get: this.getClient.bind(this),
    update: this.updateClient.bind(this),
    delete: this.deleteClient.bind(this),
    list: this.listClients.bind(this),
  };

  public plans = {
    get: this.getPlan.bind(this),
    list: this.listPlans.bind(this),
  };

  public subscriptions = {
    create: this.createSubscription.bind(this),
    get: this.getSubscription.bind(this),
    list: this.listSubscriptions.bind(this),
    listV3: this.listSubscriptionsV3.bind(this),
    delete: this.deleteSubscription.bind(this),
  };

  public transactions = {
    create: this.createSubscriptionTransaction.bind(this),
  };

  public cards = {
    register: this.registerCard.bind(this),
    delete: this.deleteCard.bind(this),
  };

  public verifyActivationNotify = this.verifyActivationNotification.bind(this);
  public verifyPaymentNotify = this.verifyPaymentNotification.bind(this);

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return fn().catch((error) => {
      throw createPaykuAPIError(
        error,
        operation,
        PaykuSubscriptionsError,
        this.options,
      );
    });
  }

  private createClient(params: PaykuCreateSubscriptionClientRequest) {
    return this.wrap("subscriptions.clients.create", async () => {
      validateCreateSubscriptionClientRequest(params);
      return this.http.request<PaykuSubscriptionClientResponse>({
        method: "POST",
        path: "/suclient",
        body: bodyAsRecord(params),
        signed: true,
      });
    });
  }

  private getClient(id: string) {
    return this.wrap("subscriptions.clients.get", () =>
      this.http.request<PaykuSubscriptionClientResponse>({
        method: "GET",
        path: `/suclient/${id}`,
        signed: true,
      }),
    );
  }

  private updateClient(
    id: string,
    params: PaykuUpdateSubscriptionClientRequest,
  ) {
    return this.wrap("subscriptions.clients.update", () =>
      this.http.request<PaykuSubscriptionClientResponse>({
        method: "PUT",
        path: `/suclient/${id}`,
        body: bodyAsRecord(params),
        signed: true,
      }),
    );
  }

  private deleteClient(id: string) {
    return this.wrap("subscriptions.clients.delete", () =>
      this.http.request<PaykuDeleteSubscriptionClientResponse>({
        method: "DELETE",
        path: `/suclient/${id}`,
        signed: true,
      }),
    );
  }

  private listClients(query?: PaykuListSubscriptionClientsParams) {
    return this.wrap("subscriptions.clients.list", async () => {
      if (query) {
        validateListSubscriptionClientsParams(query);
      }
      return this.http.request<PaykuListSubscriptionClientsResponse>({
        method: "GET",
        path: "/suclient/customers",
        query: query as Record<string, unknown> | undefined,
        signed: true,
      });
    });
  }

  private getPlan(id: string) {
    return this.wrap("subscriptions.plans.get", () =>
      this.http.request<PaykuGetSubscriptionPlanResponse>({
        method: "GET",
        path: `/suplan/${id}`,
        signed: true,
      }),
    );
  }

  private listPlans() {
    return this.wrap("subscriptions.plans.list", () =>
      this.http.request<PaykuListSubscriptionPlansResponse>({
        method: "GET",
        path: "/suplan/plans",
        signed: true,
      }),
    );
  }

  private createSubscription(params: PaykuCreateSubscriptionRequest) {
    return this.wrap("subscriptions.create", async () => {
      validateCreateSubscriptionRequest(params);
      return this.http.request<PaykuCreateSubscriptionResponse>({
        method: "POST",
        path: "/sususcription",
        body: bodyAsRecord(params),
        signed: true,
      });
    });
  }

  private getSubscription(id: string) {
    return this.wrap("subscriptions.get", () =>
      this.http.request<PaykuGetSubscriptionResponse>({
        method: "GET",
        path: `/sususcription/${id}`,
        signed: true,
      }),
    );
  }

  private listSubscriptions(query?: PaykuListSubscriptionsQuery) {
    return this.wrap("subscriptions.list", () =>
      this.http.request<PaykuListSubscriptionsResponse>({
        method: "GET",
        path: "/sususcription",
        query: query as Record<string, unknown> | undefined,
        signed: true,
      }),
    );
  }

  private listSubscriptionsV3(query?: PaykuListSubscriptionsV3Query) {
    return this.wrap("subscriptions.listV3", () =>
      this.http.request<PaykuListSubscriptionsV3Response>({
        method: "GET",
        path: "/sususcriptionv3",
        query: query as Record<string, unknown> | undefined,
        signed: true,
      }),
    );
  }

  private deleteSubscription(id: string) {
    return this.wrap("subscriptions.delete", () =>
      this.http.request<PaykuDeleteSubscriptionResponse>({
        method: "DELETE",
        path: `/sususcription/${id}`,
        signed: true,
      }),
    );
  }

  private createSubscriptionTransaction(
    params: PaykuCreateSubscriptionTransactionRequest,
  ) {
    return this.wrap("subscriptions.transactions.create", async () => {
      validateCreateSubscriptionTransactionRequest(params);
      return this.http.request<PaykuCreateSubscriptionTransactionResponse>({
        method: "POST",
        path: "/sutransaction",
        body: bodyAsRecord(params),
        signed: true,
      });
    });
  }

  private registerCard(params: PaykuRegisterCardRequest) {
    return this.wrap("subscriptions.cards.register", () =>
      this.http.request<PaykuRegisterCardResponse>({
        method: "POST",
        path: "/suinscriptionscards",
        body: bodyAsRecord(params),
        signed: true,
      }),
    );
  }

  private deleteCard(params: PaykuDeleteCardRequest) {
    return this.wrap("subscriptions.cards.delete", () =>
      this.http.request<PaykuDeleteCardResponse>({
        method: "POST",
        path: "/suscriptionsdeletecards",
        body: bodyAsRecord(params),
        signed: true,
      }),
    );
  }

  /**
   * Verifica `POST /urlnotifysuscription` reconsultando `GET /api/sususcription/{id}`.
   * El payload no trae `verification_key`; la fuente de verdad es el GET.
   */
  private async verifyActivationNotification(
    payload: PaykuSubscriptionActivationNotifyPayload,
    options: PaykuVerifySubscriptionActivationNotifyOptions = {},
  ): Promise<PaykuVerifySubscriptionActivationNotifyResult> {
    const subscriptionId = nonEmptyString(payload.id);
    if (subscriptionId === undefined) {
      return { valid: false, reason: "missing_id", notify: payload };
    }

    const expectedStatus = nonEmptyString(
      options.expectedStatus ?? payload.status,
    );
    if (expectedStatus === undefined) {
      return { valid: false, reason: "missing_status", notify: payload };
    }

    try {
      const subscription = await this.getSubscription(subscriptionId);

      if (subscription.status !== expectedStatus) {
        return {
          valid: false,
          reason: "status_mismatch",
          notify: payload,
          subscription,
        };
      }

      return { valid: true, subscription, notify: payload };
    } catch (error) {
      if (error instanceof PaykuAPIError) {
        return {
          valid: false,
          reason: "payku_api_error",
          notify: payload,
          error,
        };
      }

      throw error;
    }
  }

  /**
   * Verifica `POST /urlnotifypayment` reconsultando `GET /api/sususcription/{id}`.
   * No uses `webhooks.verifyNotify` (ese reconsulta `/transaction/{payment_key}`).
   *
   * Si no pasas `expectedStatus`, se deriva del `payload.status` mapeando
   * notify `failed` → API `rejected`.
   *
   * Si `payload.verification_key` y la transacción del GET (o
   * `expectedVerificationKey`) tienen valor, deben coincidir.
   */
  private async verifyPaymentNotification(
    payload: PaykuSubscriptionPaymentNotifyPayload,
    options: PaykuVerifySubscriptionPaymentNotifyOptions = {},
  ): Promise<PaykuVerifySubscriptionPaymentNotifyResult> {
    const subscriptionId = nonEmptyString(payload.subscriptions?.id);
    if (subscriptionId === undefined) {
      return { valid: false, reason: "missing_id", notify: payload };
    }

    const transactionId = nonEmptyString(payload.transaction_id);
    if (transactionId === undefined) {
      return {
        valid: false,
        reason: "missing_transaction_id",
        notify: payload,
      };
    }

    const rawStatus = options.expectedStatus ?? payload.status;
    if (nonEmptyString(rawStatus) === undefined) {
      return { valid: false, reason: "missing_status", notify: payload };
    }

    const expectedStatus = mapNotifyStatusToTransactionStatus(
      String(rawStatus).trim(),
    );

    try {
      const subscription = await this.getSubscription(subscriptionId);

      const notifyClient = nonEmptyString(payload.subscriptions?.client);
      const apiClient = nonEmptyString(subscription.client?.id);
      if (
        notifyClient !== undefined &&
        apiClient !== undefined &&
        notifyClient !== apiClient
      ) {
        return {
          valid: false,
          reason: "client_mismatch",
          notify: payload,
          subscription,
        };
      }

      const transaction = findSubscriptionTransaction(
        subscription,
        transactionId,
      );
      if (transaction === undefined) {
        return {
          valid: false,
          reason: "transaction_not_found",
          notify: payload,
          subscription,
        };
      }

      const actualStatus = nonEmptyString(transaction.status);
      if (actualStatus !== expectedStatus) {
        return {
          valid: false,
          reason: "status_mismatch",
          notify: payload,
          subscription,
          transaction,
        };
      }

      const expectedOrder =
        nonEmptyString(options.expectedOrder) ??
        nonEmptyString(payload.order);
      const actualOrder = nonEmptyString(transaction.order);
      if (expectedOrder !== undefined && actualOrder !== expectedOrder) {
        return {
          valid: false,
          reason: "order_mismatch",
          notify: payload,
          subscription,
          transaction,
        };
      }

      const expectedAmount = nonEmptyString(options.expectedAmount);
      const actualAmount = nonEmptyString(transaction.amount);
      if (expectedAmount !== undefined && actualAmount !== expectedAmount) {
        return {
          valid: false,
          reason: "amount_mismatch",
          notify: payload,
          subscription,
          transaction,
        };
      }

      const notifyKey = nonEmptyString(payload.verification_key);
      const paymentVerificationKey = nonEmptyString(
        transaction.verification_key,
      );
      const expectedKey = nonEmptyString(options.expectedVerificationKey);
      const referenceKey = paymentVerificationKey ?? expectedKey;

      if (
        notifyKey !== undefined &&
        referenceKey !== undefined &&
        !verificationKeysEqual(notifyKey, referenceKey)
      ) {
        return {
          valid: false,
          reason: "verification_key_mismatch",
          notify: payload,
          subscription,
          transaction,
        };
      }

      if (
        expectedKey !== undefined &&
        paymentVerificationKey !== undefined &&
        !verificationKeysEqual(expectedKey, paymentVerificationKey)
      ) {
        return {
          valid: false,
          reason: "verification_key_mismatch",
          notify: payload,
          subscription,
          transaction,
        };
      }

      return {
        valid: true,
        subscription,
        transaction,
        notify: payload,
      };
    } catch (error) {
      if (error instanceof PaykuAPIError) {
        return {
          valid: false,
          reason: "payku_api_error",
          notify: payload,
          error,
        };
      }

      throw error;
    }
  }
}

function findSubscriptionTransaction(
  subscription: PaykuGetSubscriptionResponse,
  transactionId: string,
): PaykuSubscriptionDetailTransaction | undefined {
  if (!Array.isArray(subscription.transactions)) {
    return undefined;
  }

  return subscription.transactions.find(
    (item) => nonEmptyString(item.transaction) === transactionId,
  );
}
