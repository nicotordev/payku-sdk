import { isAxiosError } from "axios";
import type { PaykuCountry, PaykuFeature } from "./types/payku.common";
import {
  isPaykuFailedResponse,
  isPaykuUnauthorizedResponse,
} from "./types/payku.responses";

export interface PaykuClientOptions {
  logging?: boolean;
  logger?: PaykuLogger;
}

export interface PaykuLogger {
  error(event: PaykuAPIErrorLogEvent): void;
}

export interface PaykuAPIErrorLogEvent {
  operation: string;
  statusCode?: number;
  type?: string;
  message: string;
}

export class PaykuError extends Error {
  readonly statusCode?: number;
  readonly type?: string;
  readonly response?: unknown;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      type?: string;
      response?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "PaykuError";
    this.statusCode = options.statusCode;
    this.type = options.type;
    this.response = options.response;
  }
}

export class PaykuAuthenticationError extends PaykuError {
  constructor(message = "Payku: publicToken and privateToken are required") {
    super(message, { type: "AuthenticationError" });
    this.name = "PaykuAuthenticationError";
  }
}

export class PaykuUnsupportedFeatureError extends PaykuError {
  readonly feature: PaykuFeature;
  readonly country: PaykuCountry;

  constructor(feature: PaykuFeature, country: PaykuCountry) {
    super(`Feature "${feature}" is not supported for country ${country}`, {
      type: "UnsupportedFeature",
    });
    this.name = "PaykuUnsupportedFeatureError";
    this.feature = feature;
    this.country = country;
  }
}

export class PaykuAPIError extends PaykuError {
  readonly providerCode?: string;
  readonly providerMessage?: string;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      type?: string;
      response?: unknown;
      providerCode?: string;
      providerMessage?: string;
    } = {},
  ) {
    super(message, options);
    this.name = "PaykuAPIError";
    this.providerCode = options.providerCode;
    this.providerMessage = options.providerMessage;
  }
}

export class PaykuCreateTransactionError extends PaykuAPIError {
  constructor(
    message: string,
    options?: ConstructorParameters<typeof PaykuAPIError>[1],
  ) {
    super(message, options);
    this.name = "PaykuCreateTransactionError";
  }
}

export class PaykuGetTransactionError extends PaykuAPIError {
  constructor(
    message: string,
    options?: ConstructorParameters<typeof PaykuAPIError>[1],
  ) {
    super(message, options);
    this.name = "PaykuGetTransactionError";
  }
}

export class PaykuListTransactionsError extends PaykuAPIError {
  constructor(
    message: string,
    options?: ConstructorParameters<typeof PaykuAPIError>[1],
  ) {
    super(message, options);
    this.name = "PaykuListTransactionsError";
  }
}

export class PaykuWalletError extends PaykuAPIError {
  constructor(
    message: string,
    options?: ConstructorParameters<typeof PaykuAPIError>[1],
  ) {
    super(message, options);
    this.name = "PaykuWalletError";
  }
}

export class PaykuSubscriptionsError extends PaykuAPIError {
  constructor(
    message: string,
    options?: ConstructorParameters<typeof PaykuAPIError>[1],
  ) {
    super(message, options);
    this.name = "PaykuSubscriptionsError";
  }
}

export function isPaykuError(error: unknown): error is PaykuError {
  return error instanceof PaykuError;
}

function getPaykuErrorBody(data: unknown): Record<string, unknown> | undefined {
  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  return data as Record<string, unknown>;
}

export function extractPaykuErrorMessage(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return "Unknown Payku error";
  }

  if (isPaykuUnauthorizedResponse(data)) {
    const messageError = data.message_error;

    if (typeof messageError === "string") {
      return messageError;
    }

    if (typeof messageError === "object" && messageError !== null) {
      return (
        (messageError as { error?: string }).error ??
        JSON.stringify(messageError)
      );
    }
  }

  if (isPaykuFailedResponse(data)) {
    const messageError = data.message_error;

    if (typeof messageError === "string") {
      return messageError;
    }

    if (typeof messageError === "object" && messageError !== null) {
      return JSON.stringify(messageError);
    }

    if (typeof data.id === "string") {
      return data.id;
    }
  }

  const payload = data as Record<string, unknown>;
  const messageError = payload.message_error;

  if (typeof messageError === "string") {
    return messageError;
  }

  if (typeof messageError === "object" && messageError !== null) {
    return JSON.stringify(messageError);
  }

  if (typeof payload.type === "string") {
    return payload.type;
  }

  return "Unknown Payku error";
}

export function createPaykuAPIError(
  error: unknown,
  operation: string,
  ErrorClass: typeof PaykuAPIError = PaykuAPIError,
  options?: PaykuClientOptions,
): PaykuAPIError {
  if (error instanceof PaykuAPIError) {
    return error;
  }

  if (error instanceof PaykuError) {
    return new ErrorClass(error.message, {
      statusCode: error.statusCode,
      type: error.type,
      response: error.response,
    });
  }

  if (isAxiosError(error)) {
    const responseData = error.response?.data;
    const body = getPaykuErrorBody(responseData);
    const message = extractPaykuErrorMessage(responseData ?? error.message);
    const apiError = new ErrorClass(message, {
      statusCode: error.response?.status,
      type: typeof body?.type === "string" ? body.type : undefined,
      response: responseData,
      providerMessage: message,
    });

    logPaykuAPIError(apiError, operation, options);
    return apiError;
  }

  const apiError = new ErrorClass(
    error instanceof Error ? error.message : "Unknown Payku error",
  );

  logPaykuAPIError(apiError, operation, options);
  return apiError;
}

function logPaykuAPIError(
  error: PaykuAPIError,
  operation: string,
  options?: PaykuClientOptions,
): void {
  if (!options?.logging && !options?.logger) {
    return;
  }

  const event: PaykuAPIErrorLogEvent = {
    operation,
    statusCode: error.statusCode,
    type: error.type,
    message: error.message,
  };

  try {
    if (options.logger) {
      options.logger.error(event);
      return;
    }

    if (options.logging) {
      console.error("[payku]", event);
    }
  } catch {
    // Never mask the original API error if logging fails.
  }
}
