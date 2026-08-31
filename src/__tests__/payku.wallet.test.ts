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

describe("PaykuWallet payout create", () => {
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

  test("create maps identifier_wallet and identifier_payout fixture", async () => {
    const createFixture = {
      status: "success",
      identifier_wallet: "wab5f7232dafff18f9",
      identifier_payout: "mor33e36b01e8a11b9ee",
    };

    mock.onPost("/wallet/payout").reply(200, createFixture);

    const response = await wallet.payouts.create({
      email: "test@test.com",
      subject: "payout order",
      currency: "CLP",
      order: "367734544",
      amount: 1000,
      accountbank_name: "test",
      accountbank_rut: "111111111",
      accountbank_sbif: "0001",
      accountbank_type: "1",
      accountbank_num: "123123123",
    });

    expect(response).toEqual(createFixture);
    expect(response.identifier_wallet).toBe("wab5f7232dafff18f9");
    expect(response.identifier_payout).toBe("mor33e36b01e8a11b9ee");
  });
});
