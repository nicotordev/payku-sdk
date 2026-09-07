import {
  createPaykuAPIError,
  PaykuMallError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  validateCreateMallTransactionRequest,
  validateGetMallTransactionParams,
} from "../utils/payku.utils";
import type {
  PaykuMallCreateResponse,
  PaykuMallGetResponse,
  PaykuMallTransactionRequest,
} from "../types/payku.mall";

export default class PaykuMall {
  public create = this.createTransaction.bind(this);
  public get = this.getTransaction.bind(this);

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return fn().catch((error) => {
      throw createPaykuAPIError(
        error,
        operation,
        PaykuMallError,
        this.options,
      );
    });
  }

  private createTransaction(
    params: PaykuMallTransactionRequest,
  ): Promise<PaykuMallCreateResponse> {
    return this.wrap("mall.create", async () => {
      validateCreateMallTransactionRequest(params);
      return this.http.request<PaykuMallCreateResponse>({
        method: "POST",
        path: "/mall",
        body: bodyAsRecord(params),
        signed: true,
      });
    });
  }

  private getTransaction(id: string): Promise<PaykuMallGetResponse> {
    return this.wrap("mall.get", async () => {
      validateGetMallTransactionParams(id);
      return this.http.request<PaykuMallGetResponse>({
        method: "GET",
        path: `/mall/${id}`,
      });
    });
  }
}
