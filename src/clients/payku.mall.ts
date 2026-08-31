import {
  createPaykuAPIError,
  PaykuAPIError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import { bodyAsRecord } from "../utils/payku.utils";
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

  private createTransaction(
    params: PaykuMallTransactionRequest,
  ): Promise<PaykuMallCreateResponse> {
    return this.http
      .request<PaykuMallCreateResponse>({
        method: "POST",
        path: "/mall",
        body: bodyAsRecord(params),
        signed: true,
      })
      .catch((error) => {
        throw createPaykuAPIError(
          error,
          "mall.create",
          PaykuAPIError,
          this.options,
        );
      });
  }

  private getTransaction(id: string): Promise<PaykuMallGetResponse> {
    return this.http
      .request<PaykuMallGetResponse>({
        method: "GET",
        path: `/mall/${id}`,
      })
      .catch((error) => {
        throw createPaykuAPIError(
          error,
          "mall.get",
          PaykuAPIError,
          this.options,
        );
      });
  }
}
