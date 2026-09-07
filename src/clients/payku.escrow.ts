import {
  createPaykuAPIError,
  PaykuEscrowError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  validateEscrowAuthorizeRequest,
} from "../utils/payku.utils";
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

  private wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return fn().catch((error) => {
      throw createPaykuAPIError(
        error,
        operation,
        PaykuEscrowError,
        this.options,
      );
    });
  }

  private authorizeSettlement(params: PaykuEscrowAuthorizeRequest) {
    return this.wrap("escrow.authorize", async () => {
      validateEscrowAuthorizeRequest(params);
      return this.http.request<PaykuEscrowAuthorizeResponse>({
        method: "POST",
        path: "/escrow",
        body: bodyAsRecord(params),
      });
    });
  }
}
