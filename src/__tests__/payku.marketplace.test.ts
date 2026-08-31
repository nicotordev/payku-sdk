import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuMarketplace from "../clients/payku.marketplace";
import { HttpClient } from "../http/client";
import { PaykuError } from "../errors";
import {
  buildMarketplaceAffiliation,
  validateMarketplaceAffiliationPercentages,
} from "../utils/payku.utils";

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

const affiliationFixture = {
  id: "sucaab7865dceaff49d8b3",
  status: "register",
  name: "name",
  token: "eecd92fdbb8bf615e8215d6fbb30bb6ae6f82c9e1810f85b65bbeb472794c4a4",
  percentage: "20.00",
  affiliations: [
    {
      id: "ma9fd16221a9645b0036",
      name: "name",
      percentage: "80.00",
    },
  ],
};

describe("marketplace affiliation helpers", () => {
  test("buildMarketplaceAffiliation builds wire pairs", () => {
    expect(
      buildMarketplaceAffiliation([
        { clientId: "ma9fd16221a9645b0036", percentage: 80 },
      ]),
    ).toEqual([["ma9fd16221a9645b0036", "80"]]);
  });

  test("validateMarketplaceAffiliationPercentages accepts 100", () => {
    expect(() =>
      validateMarketplaceAffiliationPercentages("20", [
        ["ma9fd16221a9645b0036", "80"],
      ]),
    ).not.toThrow();
  });

  test("validateMarketplaceAffiliationPercentages accepts FP boundary within 0.01", () => {
    expect(() =>
      validateMarketplaceAffiliationPercentages("20", [
        ["ma9fd16221a9645b0036", "79.99"],
      ]),
    ).not.toThrow();
  });

  test("validateMarketplaceAffiliationPercentages rejects non-100", () => {
    expect(() =>
      validateMarketplaceAffiliationPercentages("20", [
        ["ma9fd16221a9645b0036", "70"],
      ]),
    ).toThrow(PaykuError);
  });
});

describe("PaykuMarketplace maaffiliation", () => {
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

  test("create posts name/percentage/affiliation and maps fixture", async () => {
    mock.onPost("/maaffiliation").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        name: "name",
        percentage: "20",
        affiliation: [["ma9fd16221a9645b0036", "80"]],
      });
      expect(body).not.toHaveProperty("client");
      return [200, affiliationFixture];
    });

    const response = await marketplace.affiliations.create({
      name: "name",
      percentage: "20",
      affiliation: [["ma9fd16221a9645b0036", "80"]],
    });

    expect(response).toEqual(affiliationFixture);
    expect(response.token).toBeTruthy();
  });

  test("delete returns suspended status and id", async () => {
    mock.onDelete("/maaffiliation/sucaab7865dceaff49d8b3").reply(200, {
      status: "suspended",
      id: "maab4462d6133e05e518",
    });

    const response = await marketplace.affiliations.delete(
      "sucaab7865dceaff49d8b3",
    );

    expect(response).toEqual({
      status: "suspended",
      id: "maab4462d6133e05e518",
    });
  });
});
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

describe("PaykuMarketplace Sign flags", () => {
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

  test("clients.create sends Bearer without Sign", async () => {
    mock.onPost("/maclient").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toBeUndefined();
      return [200, { status: "register", id: "macl1" }];
    });

    await marketplace.clients.create({
      email: "a@example.com",
      name: "A",
      phone: "912345678",
      bank: { sbif: "0001", type: "1", num: "1", rut: "111111111" },
    });
  });

  test("clients.update sends Sign", async () => {
    mock.onPut("/maclient/macl1").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);
      return [200, { status: "register", id: "macl1", name: "B" }];
    });

    await marketplace.clients.update("macl1", { name: "B" });
  });

  test("clients.delete sends Bearer without Sign", async () => {
    mock.onDelete("/maclient/macl1").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toBeUndefined();
      return [200, { status: "suspended", id: "macl1" }];
    });

    await marketplace.clients.delete("macl1");
  });
});
