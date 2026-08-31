import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuWallet from "../clients/payku.wallet";
import { HttpClient } from "../http/client";

describe("PaykuWallet withdraw", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let wallet: PaykuWallet;

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

    wallet = new PaykuWallet(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create posts documented minimal body on /wallet/withdraw", async () => {
    mock.onPost("/wallet/withdraw").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);

      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        subject: "withdraw 133222",
        currency: "CLP",
        order: "133222",
        amount: 1000,
      });
      expect(body).not.toHaveProperty("email");
      expect(body).not.toHaveProperty("accountbank_name");
      expect(body).not.toHaveProperty("accountbank_rut");
      expect(body).not.toHaveProperty("accountbank_sbif");
      expect(body).not.toHaveProperty("accountbank_type");
      expect(body).not.toHaveProperty("accountbank_num");

      return [
        200,
        {
          status: "success",
          identifier_wallet: "wab5f7232dafff18f9",
        },
      ];
    });

    const response = await wallet.withdraw.create({
      subject: "withdraw 133222",
      currency: "CLP",
      order: "133222",
      amount: 1000,
    });

    expect(response.status).toBe("success");
    expect(response.identifier_wallet).toBe("wab5f7232dafff18f9");
    expect(response).not.toHaveProperty("identifier_payout");
  });
});

describe("PaykuWallet balance and movements", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let wallet: PaykuWallet;

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

    wallet = new PaykuWallet(http);
  });

  afterEach(() => {
    mock.restore();
  });

  const walletEnvelope = {
    status: "success",
    current_id: "wa8a6171ab83323c37",
    amount_available: 1766,
    currency: "CLP",
    filter: {
      page: 1,
      per_page: 1000,
      currency: "CLP",
      id: "wa8a6171ab83323c37",
    },
    wallet_movements: [
      {
        id: "wa8a6171ab83323c37",
        order: "tme5",
        subject: "tme5 asunto",
        created_at: "2023-06-09 20:07:02",
        income_expense: "expense",
        status: "current",
        amount: "3680",
        actual_amount: "1766",
        currency: "CLP",
        payout: {
          id: "war3999847529816f2",
          status: "pending",
          update_at: "2023-06-09 21:10:46",
        },
      },
    ],
  };

  test("balance.get maps filter and wallet_movements.payout", async () => {
    mock.onGet("/wallet").reply(200, walletEnvelope);

    const response = await wallet.balance.get();

    expect(response).toEqual(walletEnvelope);
    expect(response.filter?.page).toBe(1);
    expect(response.wallet_movements?.[0]?.payout?.update_at).toBe(
      "2023-06-09 21:10:46",
    );
  });

  test("movements.list maps shared envelope and forwards query", async () => {
    mock.onGet("/wallet/list").reply((config) => {
      expect(config.params).toMatchObject({ page: 1, per_page: 10, currency: "CLP" });
      return [200, walletEnvelope];
    });

    const response = await wallet.movements.list({
      page: 1,
      per_page: 10,
      currency: "CLP",
    });

    expect(response.current_id).toBe("wa8a6171ab83323c37");
    expect(response.amount_available).toBe(1766);
    expect(response.filter?.currency).toBe("CLP");
  });
});
