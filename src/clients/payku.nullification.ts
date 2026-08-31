import {
  createPaykuAPIError,
  PaykuAPIError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import { bodyAsRecord } from "../utils/payku.utils";
import type {
  PaykuCreateNullificationResponse,
  PaykuGetNullificationResponse,
  PaykuNullificationCreateRequest,
} from "../types/payku.nullification";

export default class PaykuNullification {
  public create = this.createNullification.bind(this);
  public get = this.getNullification.bind(this);

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private createNullification(
    params: PaykuNullificationCreateRequest,
  ): Promise<PaykuCreateNullificationResponse> {
    return this.http
      .request<PaykuCreateNullificationResponse>({
        method: "POST",
        path: "/nullification",
        body: bodyAsRecord(params),
        signed: true,
      })
      .catch((error) => {
        throw createPaykuAPIError(
          error,
          "nullification.create",
          PaykuAPIError,
          this.options,
        );
      });
  }

  private getNullification(id: string): Promise<PaykuGetNullificationResponse> {
    return this.http
      .request<PaykuGetNullificationResponse>({
        method: "GET",
        path: `/nullification/${id}`,
        // Docs omit Sign on GET examples, but sandbox returns 401
        // `error:waiting sign` without it — keep signed.
        signed: true,
      })
      .catch((error) => {
        throw createPaykuAPIError(
          error,
          "nullification.get",
          PaykuAPIError,
          this.options,
        );
      });
  }
}
