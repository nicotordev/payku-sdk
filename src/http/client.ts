import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  isAxiosError,
} from "axios";
import { extractPaykuErrorMessage, PaykuError } from "../errors";
import {
  isPaykuFailedResponse,
  isPaykuUnauthorizedResponse,
} from "../types/payku.responses";
import { buildSign, type SignParams } from "./sign";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface HttpClientConfig {
  baseUrl: string;
  rootUrl: string;
  publicToken: string;
  privateToken: string;
  logging?: boolean;
  /** Solo para tests — inyecta instancias axios mockeables. */
  axiosInstance?: AxiosInstance;
  rootAxiosInstance?: AxiosInstance;
}

export interface RequestOptions {
  method: HttpMethod;
  path: string;
  query?: SignParams;
  body?: Record<string, unknown>;
  signed?: boolean;
  auth?: boolean;
  signPath?: string;
}

export interface RootRequestOptions extends RequestOptions {
  /** Path used for signing when it differs from the request path. */
  signPath?: string;
}

function extractErrorType(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  const type = (data as Record<string, unknown>).type;
  return typeof type === "string" ? type : undefined;
}

function assertNotFailedResponse(data: unknown, statusCode: number): void {
  if (isPaykuFailedResponse(data)) {
    throw new PaykuError(extractPaykuErrorMessage(data), {
      statusCode,
      type: extractErrorType(data),
      response: data,
    });
  }

  if (isPaykuUnauthorizedResponse(data)) {
    throw new PaykuError(extractPaykuErrorMessage(data), {
      statusCode,
      type: data.type,
      response: data,
    });
  }
}

export class HttpClient {
  private readonly axios: AxiosInstance;
  private readonly rootAxios: AxiosInstance;
  private readonly publicToken: string;
  private readonly privateToken: string;
  private readonly logging: boolean;

  constructor(config: HttpClientConfig) {
    this.publicToken = config.publicToken;
    this.privateToken = config.privateToken;
    this.logging = config.logging ?? false;
    this.axios =
      config.axiosInstance ??
      axios.create({
        baseURL: config.baseUrl,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    this.rootAxios =
      config.rootAxiosInstance ??
      axios.create({
        baseURL: config.rootUrl,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const apiPath = options.signPath ?? `/api${options.path}`;
    return this.execute<T>(this.axios, {
      ...options,
      url: options.path,
      signPath: apiPath,
    });
  }

  async requestRoot<T>(options: RootRequestOptions): Promise<T> {
    const signPath = options.signPath ?? options.path;
    return this.execute<T>(this.rootAxios, {
      ...options,
      url: options.path,
      signPath,
    });
  }

  private async execute<T>(
    client: AxiosInstance,
    options: RequestOptions & { url: string; signPath: string },
  ): Promise<T> {
    const query = options.query ?? {};
    const body = options.body;
    const useAuth = options.auth ?? true;

    const headers: Record<string, string> = {};

    if (useAuth) {
      headers.Authorization = `Bearer ${this.publicToken}`;
    }

    if (options.signed) {
      const signParams = options.method === "GET" ? query : (body ?? {});
      headers.Sign = buildSign(options.signPath, signParams, this.privateToken);
    }

    const axiosConfig: AxiosRequestConfig = {
      method: options.method,
      url: options.url,
      headers,
      params: query,
      data: body,
    };

    if (this.logging) {
      console.debug("[payku]", options.method, options.signPath, {
        query,
        body,
        signed: options.signed ?? false,
      });
    }

    try {
      const response: AxiosResponse<T> = await client.request<T>(axiosConfig);
      assertNotFailedResponse(response.data, response.status);
      return response.data;
    } catch (error) {
      if (error instanceof PaykuError) {
        throw error;
      }

      if (isAxiosError(error)) {
        const statusCode = error.response?.status;
        const responseData = error.response?.data;

        throw new PaykuError(
          extractPaykuErrorMessage(responseData ?? error.message),
          {
            statusCode,
            type: extractErrorType(responseData),
            response: responseData,
          },
        );
      }

      throw error;
    }
  }
}
