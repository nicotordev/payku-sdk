import {
  createPaykuAPIError,
  PaykuEventsError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  validateCreateEventRequest,
  validateGetEventParams,
} from "../utils/payku.utils";
import type {
  PaykuCreateEventRequest,
  PaykuCreateEventResponse,
  PaykuGetEventResponse,
} from "../types/payku.events";

export default class PaykuEvents {
  public create = this.createEvent.bind(this);
  public get = this.getEvent.bind(this);

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return fn().catch((error) => {
      throw createPaykuAPIError(
        error,
        operation,
        PaykuEventsError,
        this.options,
      );
    });
  }

  private createEvent(
    params: PaykuCreateEventRequest,
  ): Promise<PaykuCreateEventResponse> {
    return this.wrap("events.create", async () => {
      validateCreateEventRequest(params);
      return this.http.request<PaykuCreateEventResponse>({
        method: "POST",
        path: "/event",
        body: bodyAsRecord(params),
      });
    });
  }

  private getEvent(id: string): Promise<PaykuGetEventResponse> {
    return this.wrap("events.get", async () => {
      validateGetEventParams(id);
      return this.http.request<PaykuGetEventResponse>({
        method: "GET",
        path: `/event/${id}`,
      });
    });
  }
}
