import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuNullification from "../clients/payku.nullification";
import { HttpClient } from "../http/client";

describe("PaykuNullification create", () => {
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

  test("create posts id, amount, subject (not transaction)", async () => {
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

      return [
        200,
        {
          status: "success",
          id: "trxpr2a45s1dytg1",
        },
      ];
    });

    const response = await nullification.create({
      id: "trxpr2a45s1dytg1",
      amount: 25000,
      subject: "anulación transacción",
    });

    expect(response.status).toBe("success");
    expect(response.id).toBe("trxpr2a45s1dytg1");
  });
});
