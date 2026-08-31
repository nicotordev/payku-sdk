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
  PaykuDeleteCardResponse,
  PaykuRegisterCardRequest,
  PaykuRegisterCardResponse,
  PaykuSubscriptionClientRequest,
  PaykuSubscriptionClientResponse,
  PaykuSubscriptionPlansResponse,
  PaykuSubscriptionResponse,
  PaykuSubscriptionsListResponse,
} from "../types/payku.subscriptions";

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

  private createClient(params: PaykuSubscriptionClientRequest) {
    return this.wrap("subscriptions.clients.create", () =>
      this.http.request<PaykuSubscriptionClientResponse>({
        method: "POST",
        path: "/suclient",
        body: bodyAsRecord(params),
        signed: true,
      }),
    );
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

  private updateClient(id: string, params: PaykuSubscriptionClientRequest) {
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
      this.http.request<PaykuSubscriptionClientResponse>({
        method: "DELETE",
        path: `/suclient/${id}`,
        signed: true,
      }),
    );
  }

  private listClients() {
    return this.wrap("subscriptions.clients.list", () =>
      this.http.request<PaykuSubscriptionsListResponse>({
        method: "GET",
        path: "/suclient/customers",
        signed: true,
      }),
    );
  }

  private getPlan(id: string) {
    return this.wrap("subscriptions.plans.get", () =>
      this.http.request<PaykuSubscriptionPlansResponse>({
        method: "GET",
        path: `/suplan/${id}`,
        signed: true,
      }),
    );
  }

  private listPlans() {
    return this.wrap("subscriptions.plans.list", () =>
      this.http.request<PaykuSubscriptionPlansResponse>({
        method: "GET",
        path: "/suplan/plans",
        signed: true,
      }),
    );
  }

  private createSubscription(params: PaykuCreateSubscriptionRequest) {
    return this.wrap("subscriptions.create", () =>
      this.http.request<PaykuSubscriptionResponse>({
        method: "POST",
        path: "/sususcription",
        body: bodyAsRecord(params),
        signed: true,
      }),
    );
  }

  private getSubscription(id: string) {
    return this.wrap("subscriptions.get", () =>
      this.http.request<PaykuSubscriptionResponse>({
        method: "GET",
        path: `/sususcription/${id}`,
        signed: true,
      }),
    );
  }

  private listSubscriptions() {
    return this.wrap("subscriptions.list", () =>
      this.http.request<PaykuSubscriptionsListResponse>({
        method: "GET",
        path: "/sususcription",
        signed: true,
      }),
    );
  }

  private listSubscriptionsV3() {
    return this.wrap("subscriptions.listV3", () =>
      this.http.request<PaykuSubscriptionsListResponse>({
        method: "GET",
        path: "/sususcriptionv3",
        signed: true,
      }),
    );
  }

  private deleteSubscription(id: string) {
    return this.wrap("subscriptions.delete", () =>
      this.http.request<PaykuSubscriptionResponse>({
        method: "DELETE",
        path: `/sususcription/${id}`,
        signed: true,
      }),
    );
  }

  private createSubscriptionTransaction(
    params: PaykuCreateSubscriptionTransactionRequest,
  ) {
    return this.wrap("subscriptions.transactions.create", () =>
      this.http.request<PaykuCreateSubscriptionTransactionResponse>({
        method: "POST",
        path: "/sutransaction",
        body: bodyAsRecord(params),
        signed: true,
      }),
    );
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
}
