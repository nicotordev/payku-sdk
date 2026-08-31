import {
  createPaykuAPIError,
  PaykuAPIError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import { bodyAsRecord } from "../utils/payku.utils";
import type {
  PaykuEscrowAuthorizeRequest,
  PaykuEscrowAuthorizeResponse,
} from "../types/payku.escrow";

export default class PaykuEscrow {
  public authorize = this.authorizeSettlement.bind(this);

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private authorizeSettlement(params: PaykuEscrowAuthorizeRequest) {
    return this.http
      .request<PaykuEscrowAuthorizeResponse>({
        method: "POST",
        path: "/escrow",
        body: bodyAsRecord(params),
      })
      .catch((error) => {
        throw createPaykuAPIError(
          error,
          "escrow.authorize",
          PaykuAPIError,
          this.options,
        );
      });
  }
}
