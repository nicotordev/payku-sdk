import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuEscrow from "../clients/payku.escrow";
import { HttpClient } from "../http/client";

describe("PaykuEscrow authorize", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let escrow: PaykuEscrow;

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

    escrow = new PaykuEscrow(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("authorize posts transactions array (not transaction)", async () => {
    mock.onPost("/escrow").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");

      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        transactions: [
          "trx3b4d77b43acd9a720",
          "trx3b4d77b43acd9a385",
        ],
      });
      expect(body).not.toHaveProperty("transaction");

      return [
        200,
        {
          transactions: [
            {
              status: "liquidate",
              transaction_id: "trx3b4d77b43acd9a720",
              amount: 15000,
            },
          ],
        },
      ];
    });

    await escrow.authorize({
      transactions: [
        "trx3b4d77b43acd9a720",
        "trx3b4d77b43acd9a385",
      ],
    });
  });
});
