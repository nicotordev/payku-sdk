import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { PaykuError } from "../errors";
import { HttpClient } from "./client";

describe("HttpClient business error handling", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let http: HttpClient;

  beforeEach(() => {
    apiAxios = axios.create({
      baseURL: "https://des.payku.cl/api",
    });
    mock = new MockAdapter(apiAxios);

    http = new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl: "https://des.payku.cl",
      publicToken: "public-token",
      privateToken: "private-token",
      axiosInstance: apiAxios,
      rootAxiosInstance: apiAxios,
    });
  });

  afterEach(() => {
    mock.restore();
  });

  test("throws PaykuError for GET when API returns HTTP 200 and status failed", async () => {
    mock.onGet("/transaction/tx-404").reply(200, {
      status: "failed",
      type: "Not Found",
      message_error: "Transaction not found",
    });

    let error: unknown;
    try {
      await http.request({
        method: "GET",
        path: "/transaction/tx-404",
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(PaykuError);
    expect(error).toMatchObject({
      name: "PaykuError",
      message: "Transaction not found",
      statusCode: 200,
      type: "Not Found",
    } satisfies Partial<PaykuError>);
  });

  test("throws PaykuError for POST when API returns HTTP 200 and status failed", async () => {
    mock.onPost("/transaction").reply(200, {
      status: "failed",
      type: "Unprocessable Entity",
      message_error: "Validation failed",
    });

    let error: unknown;
    try {
      await http.request({
        method: "POST",
        path: "/transaction",
        body: {
          amount: 0,
        },
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(PaykuError);
    expect(error).toMatchObject({
      name: "PaykuError",
      message: "Validation failed",
      statusCode: 200,
      type: "Unprocessable Entity",
    } satisfies Partial<PaykuError>);
  });
});
