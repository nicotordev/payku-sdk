import {
  createPaykuAPIError,
  PaykuAPIError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import { bodyAsRecord } from "../utils/payku.utils";
import type {
  PaykuCreateEventRequest,
  PaykuEventResponse,
} from "../types/payku.events";

export default class PaykuEvents {
  public create = this.createEvent.bind(this);
  public get = this.getEvent.bind(this);

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private createEvent(params: PaykuCreateEventRequest) {
    return this.http
      .request<PaykuEventResponse>({
        method: "POST",
        path: "/event",
        body: bodyAsRecord(params),
      })
      .catch((error) => {
        throw createPaykuAPIError(
          error,
          "events.create",
          PaykuAPIError,
          this.options,
        );
      });
  }

  private getEvent(id: string) {
    return this.http
      .request<PaykuEventResponse>({
        method: "GET",
        path: `/event/${id}`,
      })
      .catch((error) => {
        throw createPaykuAPIError(
          error,
          "events.get",
          PaykuAPIError,
          this.options,
        );
      });
  }
}
