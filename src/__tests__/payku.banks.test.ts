import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import Payku from "../clients/payku";
import PaykuBanks from "../clients/payku.banks";
import { PaykuScopedBanks } from "../clients/payku.banks.scoped";
import { HttpClient } from "../http/client";
import banksFixture from "./fixtures/chile/banks/list-200.json";

describe("PaykuBanks", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let http: HttpClient;
  let banks: PaykuBanks;

  beforeEach(() => {
    apiAxios = axios.create({ baseURL: "https://des.payku.cl/api" });
    mock = new MockAdapter(apiAxios);
    http = new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl: "https://des.payku.cl",
      publicToken: "public-token",
      privateToken: "private-token",
      axiosInstance: apiAxios,
      rootAxiosInstance: apiAxios,
    });
    banks = new PaykuBanks(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("list sends GET /banks with currency query and unwraps banks[] array", async () => {
    mock.onGet("/banks").reply((config) => {
      expect(config.params).toEqual({ currency: "clp" });
      // Endpoint público: no debe enviar Authorization ni Sign
      expect(config.headers?.Authorization).toBeUndefined();
      expect(config.headers?.Sign).toBeUndefined();
      return [200, banksFixture];
    });

    const result = await banks.list({ currency: "CLP" });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(8);
    expect(result[0]).toEqual({
      code: "0016",
      name: "Banco Bci",
      currency: "CLP",
    });
    // Verifica presencia de Banco de Chile (0001) y Banco Estado (0012)
    const bancoEstado = result.find((b) => b.code === "0012");
    expect(bancoEstado?.name).toBe("Banco Estado");
  });

  describe("defensive guard (response.banks missing or anomalous)", () => {
    test("returns empty array if response.banks is undefined", async () => {
      mock.onGet("/banks").reply(200, {
        status: "success",
      });

      const result = await banks.list({ currency: "clp" });
      expect(result).toEqual([]);
    });

    test("returns empty array if response.banks is null", async () => {
      mock.onGet("/banks").reply(200, {
        status: "success",
        banks: null,
      });

      const result = await banks.list({ currency: "clp" });
      expect(result).toEqual([]);
    });

    test("returns empty array if response is empty object", async () => {
      mock.onGet("/banks").reply(200, {});

      const result = await banks.list({ currency: "clp" });
      expect(result).toEqual([]);
    });
  });

  describe("PaykuScopedBanks (forCountry integration)", () => {
    test("infers CLP currency automatically for Chile when called without arguments", async () => {
      const scopedBanks = new PaykuScopedBanks(banks, "CL");

      mock.onGet("/banks").reply((config) => {
        expect(config.params).toEqual({ currency: "clp" });
        return [200, banksFixture];
      });

      const result = await scopedBanks.list();
      expect(result).toHaveLength(8);
    });

    test("infers PEN currency automatically for Peru", async () => {
      const scopedBanks = new PaykuScopedBanks(banks, "PE");

      mock.onGet("/banks").reply((config) => {
        expect(config.params).toEqual({ currency: "pen" });
        return [200, { status: "success", banks: [] }];
      });

      const result = await scopedBanks.list();
      expect(result).toEqual([]);
    });

    test("infers VES currency automatically for Venezuela", async () => {
      const scopedBanks = new PaykuScopedBanks(banks, "VE");

      mock.onGet("/banks").reply((config) => {
        expect(config.params).toEqual({ currency: "ves" });
        return [200, { status: "success", banks: [] }];
      });

      const result = await scopedBanks.list();
      expect(result).toEqual([]);
    });

    test("allows explicit currency override in scoped banks", async () => {
      const scopedBanks = new PaykuScopedBanks(banks, "CL");

      mock.onGet("/banks").reply((config) => {
        expect(config.params).toEqual({ currency: "pen" });
        return [200, { status: "success", banks: [] }];
      });

      const result = await scopedBanks.list({ currency: "pen" });
      expect(result).toEqual([]);
    });

    test("Payku.forCountry('CL').banks is an instance of PaykuScopedBanks", () => {
      const paykuChile = Payku.forCountry("CL", {
        publicToken: "public-token",
        privateToken: "private-token",
        environment: "sandbox",
      });

      expect(paykuChile.banks).toBeInstanceOf(PaykuScopedBanks);
    });
  });
});
