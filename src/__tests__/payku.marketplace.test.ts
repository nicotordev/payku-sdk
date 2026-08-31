import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuMarketplace from "../clients/payku.marketplace";
import { HttpClient } from "../http/client";

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
