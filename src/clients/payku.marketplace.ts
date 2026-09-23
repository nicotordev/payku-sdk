import {
  PaykuMarketplaceError,
  wrapOperation,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  normalizeMarketplaceAffiliation,
  normalizeMarketplaceClientBank,
  validateCreateMarketplaceAffiliationRequest,
  validateCreateMarketplaceClientRequest,
  validateMarketplaceTransactionRequest,
} from "../utils/payku.utils";
import type {
  PaykuCreateMarketplaceAffiliationRequest,
  PaykuCreateMarketplaceClientRequest,
  PaykuDeleteMarketplaceAffiliationResponse,
  PaykuDeleteMarketplaceClientResponse,
  PaykuMarketplaceAffiliationResponse,
  PaykuMarketplaceClientResponse,
  PaykuMarketplaceTransactionRequest,
  PaykuUpdateMarketplaceClientRequest,
  PaykuUpdateMarketplaceClientResponse,
} from "../types/payku.marketplace";
import type { PaykuCreateTransactionResponse } from "../types/payku.transactions";

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
    return wrapOperation(operation, PaykuMarketplaceError, this.options, fn);
  }

  private createClient(params: PaykuCreateMarketplaceClientRequest) {
    return this.wrap("marketplace.clients.create", async () => {
      const body = params.bank
        ? { ...params, bank: normalizeMarketplaceClientBank(params.bank) }
        : params;
      validateCreateMarketplaceClientRequest(body);
      return this.http.request<PaykuMarketplaceClientResponse>({
        method: "POST",
        path: "/maclient",
        body: bodyAsRecord(body),
      });
    });
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
    return this.wrap("marketplace.clients.update", () => {
      const body = params.bank
        ? { ...params, bank: normalizeMarketplaceClientBank(params.bank) }
        : params;
      return this.http.request<PaykuUpdateMarketplaceClientResponse>({
        method: "PUT",
        path: `/maclient/${id}`,
        body: bodyAsRecord(body),
        signed: true,
      });
    });
  }

  private deleteClient(id: string) {
    return this.wrap("marketplace.clients.delete", () =>
      this.http.request<PaykuDeleteMarketplaceClientResponse>({
        method: "DELETE",
        path: `/maclient/${id}`,
      }),
    );
  }

  private createAffiliation(params: PaykuCreateMarketplaceAffiliationRequest) {
    return this.wrap("marketplace.affiliations.create", async () => {
      const body = {
        ...params,
        percentage: String(params.percentage),
        affiliation: normalizeMarketplaceAffiliation(params.affiliation),
      };
      validateCreateMarketplaceAffiliationRequest(body);
      return this.http.request<PaykuMarketplaceAffiliationResponse>({
        method: "POST",
        path: "/maaffiliation",
        body: bodyAsRecord(body),
      });
    });
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

  private createTransaction(
    params: PaykuMarketplaceTransactionRequest,
  ): Promise<PaykuCreateTransactionResponse> {
    return this.wrap("marketplace.transactions.create", async () => {
      validateMarketplaceTransactionRequest(params);
      return this.http.request<PaykuCreateTransactionResponse>({
        method: "POST",
        path: "/transaction/",
        body: bodyAsRecord(params),
      });
    });
  }
}
