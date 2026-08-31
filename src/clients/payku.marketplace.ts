import {
  createPaykuAPIError,
  PaykuAPIError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import { bodyAsRecord } from "../utils/payku.utils";
import type {
  PaykuCreateMarketplaceAffiliationRequest,
  PaykuCreateMarketplaceClientRequest,
  PaykuDeleteMarketplaceAffiliationResponse,
  PaykuDeleteMarketplaceClientResponse,
  PaykuMarketplaceAffiliationResponse,
  PaykuMarketplaceClientResponse,
  PaykuMarketplaceTransactionRequest,
  PaykuMarketplaceUntypedResponse,
  PaykuUpdateMarketplaceClientRequest,
  PaykuUpdateMarketplaceClientResponse,
} from "../types/payku.marketplace";

export default class PaykuMarketplace {
  public clients = {
    create: this.createClient.bind(this),
    get: this.getClient.bind(this),
    update: this.updateClient.bind(this),
    delete: this.deleteClient.bind(this),
  };

  public affiliations = {
    create: this.createAffiliation.bind(this),
    get: this.getAffiliation.bind(this),
    delete: this.deleteAffiliation.bind(this),
  };

  public transactions = {
    create: this.createTransaction.bind(this),
  };

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return fn().catch((error) => {
      throw createPaykuAPIError(error, operation, PaykuAPIError, this.options);
    });
  }

  private createClient(params: PaykuCreateMarketplaceClientRequest) {
    return this.wrap("marketplace.clients.create", () =>
      this.http.request<PaykuMarketplaceClientResponse>({
        method: "POST",
        path: "/maclient",
        body: bodyAsRecord(params),
        signed: true,
      }),
    );
  }

  private getClient(id: string) {
    return this.wrap("marketplace.clients.get", () =>
      this.http.request<PaykuMarketplaceClientResponse>({
        method: "GET",
        path: `/maclient/${id}`,
      }),
    );
  }

  private updateClient(
    id: string,
    params: PaykuUpdateMarketplaceClientRequest,
  ) {
    return this.wrap("marketplace.clients.update", () =>
      this.http.request<PaykuUpdateMarketplaceClientResponse>({
        method: "PUT",
        path: `/maclient/${id}`,
        body: bodyAsRecord(params),
        signed: true,
      }),
    );
  }

  private deleteClient(id: string) {
    return this.wrap("marketplace.clients.delete", () =>
      this.http.request<PaykuDeleteMarketplaceClientResponse>({
        method: "DELETE",
        path: `/maclient/${id}`,
        signed: true,
      }),
    );
  }

  private createAffiliation(params: PaykuCreateMarketplaceAffiliationRequest) {
    return this.wrap("marketplace.affiliations.create", () =>
      this.http.request<PaykuMarketplaceAffiliationResponse>({
        method: "POST",
        path: "/maaffiliation",
        body: bodyAsRecord(params),
      }),
    );
  }

  private getAffiliation(id: string) {
    return this.wrap("marketplace.affiliations.get", () =>
      this.http.request<PaykuMarketplaceAffiliationResponse>({
        method: "GET",
        path: `/maaffiliation/${id}`,
      }),
    );
  }

  private deleteAffiliation(id: string) {
    return this.wrap("marketplace.affiliations.delete", () =>
      this.http.request<PaykuDeleteMarketplaceAffiliationResponse>({
        method: "DELETE",
        path: `/maaffiliation/${id}`,
      }),
    );
  }

  private createTransaction(params: PaykuMarketplaceTransactionRequest) {
    return this.wrap("marketplace.transactions.create", () =>
      this.http.request<PaykuMarketplaceUntypedResponse>({
        method: "POST",
        path: "/transaction/",
        body: bodyAsRecord(params),
      }),
    );
  }
}
