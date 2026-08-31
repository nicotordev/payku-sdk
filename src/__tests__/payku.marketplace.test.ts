import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuMarketplace from "../clients/payku.marketplace";
import { HttpClient } from "../http/client";

describe("PaykuMarketplace transactions", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let marketplace: PaykuMarketplace;

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

    marketplace = new PaykuMarketplace(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create posts marketplace token on /transaction/", async () => {
    mock.onPost("/transaction/").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        email: "cliente@example.com",
        order: "orden-001",
        subject: "Compra marketplace",
        amount: 1000,
        payment: 1,
        urlreturn: "https://tu-sitio.com/return",
        urlnotify: "https://tu-sitio.com/notify",
        marketplace:
          "eecd92fdbb8bf615e8215d6fbb30bb6ae6f82c9e1810f85b65bbeb472794c4a4",
      });

      return [
        200,
        {
          status: "register",
          id: "trx123",
          url: "https://des.payku.cl/gateway/show",
        },
      ];
    });

    const response = await marketplace.transactions.create({
      email: "cliente@example.com",
      order: "orden-001",
      subject: "Compra marketplace",
      amount: 1000,
      payment: 1,
      urlreturn: "https://tu-sitio.com/return",
      urlnotify: "https://tu-sitio.com/notify",
      marketplace:
        "eecd92fdbb8bf615e8215d6fbb30bb6ae6f82c9e1810f85b65bbeb472794c4a4",
    });

    expect(response).toEqual({
      status: "register",
      id: "trx123",
      url: "https://des.payku.cl/gateway/show",
    });
  });
});
