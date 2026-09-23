import {
  PaykuEventsError,
  wrapOperation,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  buildEventAffiliation,
  normalizeEventAffiliation,
  validateCreateEventRequest,
  validateGetEventParams,
} from "../utils/payku.utils";
import type {
  PaykuCreateEventRequest,
  PaykuCreateEventResponse,
  PaykuEventAffiliationMemberInput,
  PaykuEventAffiliationTuple,
  PaykuGetEventResponse,
} from "../types/payku.events";

export default class PaykuEvents {
  public create = this.createEvent.bind(this);
  public get = this.getEvent.bind(this);

  /**
   * Arma tuplas `[email, percent]`. Igual que `buildEventAffiliation`.
   * Recibe la lista de afiliados, no un solo objeto.
   */
  public static buildAffiliation(
    members: PaykuEventAffiliationMemberInput[],
  ): PaykuEventAffiliationTuple[] {
    return buildEventAffiliation(members);
  }

  /** Igual que `PaykuEvents.buildAffiliation`. */
  public buildAffiliation(
    members: PaykuEventAffiliationMemberInput[],
  ): PaykuEventAffiliationTuple[] {
    return PaykuEvents.buildAffiliation(members);
  }

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return wrapOperation(operation, PaykuEventsError, this.options, fn);
  }

  private createEvent(
    params: PaykuCreateEventRequest,
  ): Promise<PaykuCreateEventResponse> {
    return this.wrap("events.create", async () => {
      const body: PaykuCreateEventRequest = {
        ...params,
        ...(params.affiliation !== undefined
          ? { affiliation: normalizeEventAffiliation(params.affiliation) }
          : {}),
      };
      validateCreateEventRequest(body);
      return this.http.request<PaykuCreateEventResponse>({
        method: "POST",
        path: "/event",
        body: bodyAsRecord(body),
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
