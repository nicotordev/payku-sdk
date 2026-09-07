import {
  createPaykuAPIError,
  PaykuNullificationError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  validateCreateNullificationRequest,
  validateGetNullificationParams,
} from "../utils/payku.utils";
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

  private wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return fn().catch((error) => {
      throw createPaykuAPIError(
        error,
        operation,
        PaykuNullificationError,
        this.options,
      );
    });
  }

  private createNullification(
    params: PaykuNullificationCreateRequest,
  ): Promise<PaykuCreateNullificationResponse> {
    return this.wrap("nullification.create", async () => {
      validateCreateNullificationRequest(params);
      return this.http.request<PaykuCreateNullificationResponse>({
        method: "POST",
        path: "/nullification",
        body: bodyAsRecord(params),
        signed: true,
      });
    });
  }

  private getNullification(id: string): Promise<PaykuGetNullificationResponse> {
    return this.wrap("nullification.get", async () => {
      validateGetNullificationParams(id);
      return this.http.request<PaykuGetNullificationResponse>({
        method: "GET",
        path: `/nullification/${id}`,
        // Docs omit Sign on GET examples, but sandbox returns 401
        // `error:waiting sign` without it — keep signed.
        signed: true,
      });
    });
  }
}
