import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuNullification from "../clients/payku.nullification";
import { HttpClient } from "../http/client";

const createFixture = {
  status: "success",
  nullify: {
    id: "trxpr2a45s1dytg1",
    amount: 25000,
    currency: "CLP",
    type: "total" as const,
    status_nullify: "complete" as const,
    payment: {
      gateway: "webpay",
      payment_type: "VC",
    },
    created_at: "2023-05-17T19:12:57.189Z",
    updated_at: "2023-05-17T19:12:57.189Z",
  },
  gateway_response: {
    status: "Successfully registered request",
    message:
      "The cancellation will be executed after the amount requested is deducted from your next settlement",
    notify: "No availability in the wallet",
  },
};

const getFixture = {
  nullify: {
    id: "trxpr2a45s1dytg1",
    amount: 25000,
    currency: "CLP",
    type: "total" as const,
    status_nullify: "complete" as const,
    payment: {
      gateway: "webpay",
      payment_type: "VC",
    },
    created_at: "2023-05-17T19:12:57.189Z",
    updated_at: "2023-05-17T19:12:57.189Z",
  },
};

describe("PaykuNullification", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let nullification: PaykuNullification;

  beforeEach(() => {
    apiAxios = axios.create({
      baseURL: "https://des.payku.cl/api",
    });
    mock = new MockAdapter(apiAxios);

    const http = new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl: "https://des.payku.cl",
      publicToken: "public-token",
      privateToken: "private-token",
      axiosInstance: apiAxios,
      rootAxiosInstance: apiAxios,
    });

    nullification = new PaykuNullification(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create posts id, amount, subject and maps create fixture", async () => {
    mock.onPost("/nullification").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);

      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        id: "trxpr2a45s1dytg1",
        amount: 25000,
        subject: "anulación transacción",
      });
      expect(body).not.toHaveProperty("transaction");

      return [200, createFixture];
    });

    const response = await nullification.create({
      id: "trxpr2a45s1dytg1",
      amount: 25000,
      subject: "anulación transacción",
    });

    expect(response).toEqual(createFixture);
    expect(response.status).toBe("success");
    expect(response.nullify.type).toBe("total");
    expect(response.nullify.status_nullify).toBe("complete");
    expect(response.gateway_response?.notify).toContain("wallet");
  });

  test("get maps nullify fixture without top-level status", async () => {
    mock.onGet("/nullification/trxpr2a45s1dytg1").reply(200, getFixture);

    const response = await nullification.get("trxpr2a45s1dytg1");

    expect(response).toEqual(getFixture);
    expect(response).not.toHaveProperty("status");
    expect(response).not.toHaveProperty("gateway_response");
    expect(response.nullify.id).toBe("trxpr2a45s1dytg1");
    expect(response.nullify.payment?.gateway).toBe("webpay");
  });
});
