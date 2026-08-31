import type { PaykuRegisterResponse } from "./payku.responses";

export interface PaykuCreateEventRequest {
  name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface PaykuEventResponse extends PaykuRegisterResponse {
  [key: string]: unknown;
}
