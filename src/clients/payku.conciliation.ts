import {
  createPaykuAPIError,
  PaykuAPIError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import { bodyAsRecord } from "../utils/payku.utils";
import type {
  PaykuConciliationRequest,
  PaykuListConciliationsResponse,
} from "../types/payku.conciliation";

export default class PaykuConciliation {
  public create = this.createConciliation.bind(this);

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private createConciliation(
    params: PaykuConciliationRequest,
  ): Promise<PaykuListConciliationsResponse> {
    return this.http
      .request<PaykuListConciliationsResponse>({
        method: "POST",
        path: "/conciliation",
        body: bodyAsRecord(params),
      })
      .catch((error) => {
        throw createPaykuAPIError(
          error,
          "conciliation.create",
          PaykuAPIError,
          this.options,
        );
      });
  }
}
