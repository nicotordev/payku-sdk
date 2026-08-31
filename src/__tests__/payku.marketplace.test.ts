import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuMarketplace from "../clients/payku.marketplace";
import { HttpClient } from "../http/client";

const clientFixture = {
  id: "madb93fc00a2cf6f4449",
  status: "register",
  name: "John Doe",
  phone: "923122312",
  email: "johndoe@example.com",
  bank: {
    sbif: "0001",
    rut: "111111111",
    type: 1,
    num: "12312313121",
  },
  affiliations: 0,
  created_at: "2023-09-28 20:42:59",
  update_at: "null",
};

describe("PaykuMarketplace maclient", () => {
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

  test("create posts bank and maps create fixture", async () => {
    mock.onPost("/maclient").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        email: "johndoe@example.com",
        name: "John Doe",
        phone: "923122312",
        bank: {
          sbif: "0001",
          type: "1",
          num: "12312313121",
          rut: "111111111",
        },
      });
      return [200, clientFixture];
    });

    const response = await marketplace.clients.create({
      email: "johndoe@example.com",
      name: "John Doe",
      phone: "923122312",
      bank: {
        sbif: "0001",
        type: "1",
        num: "12312313121",
        rut: "111111111",
      },
    });

    expect(response).toEqual(clientFixture);
    expect(response).not.toHaveProperty("url");
    expect(response.update_at).toBe("null");
  });

  test("get maps client fixture", async () => {
    mock.onGet("/maclient/madb93fc00a2cf6f4449").reply(200, clientFixture);

    const response = await marketplace.clients.get("madb93fc00a2cf6f4449");

    expect(response).toEqual(clientFixture);
    expect(response.bank?.sbif).toBe("0001");
  });

  test("update posts partial body without email", async () => {
    mock.onPut("/maclient/madb93fc00a2cf6f4449").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({ name: "John Doe Doe", phone: "923122312" });
      expect(body).not.toHaveProperty("email");
      return [200, { ...clientFixture, name: "John Doe Doe" }];
    });

    const response = await marketplace.clients.update(
      "madb93fc00a2cf6f4449",
      { name: "John Doe Doe", phone: "923122312" },
    );

    expect(response.name).toBe("John Doe Doe");
  });
});
