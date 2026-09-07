import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import Payku from "../clients/payku";
import PaykuPaymentMethods from "../clients/payku.payment-methods";
import { PaykuScopedPaymentMethods } from "../clients/payku.payment-methods.scoped";
import { HttpClient } from "../http/client";
import paymentMethodsFixture from "./fixtures/chile/payment-methods/list-200.json";

describe("PaykuPaymentMethods", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let http: HttpClient;
  let paymentMethods: PaykuPaymentMethods;

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
    paymentMethods = new PaykuPaymentMethods(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("list without query sends GET /paymentmethods without params and unwraps payment_methods[]", async () => {
    mock.onGet("/paymentmethods").reply((config) => {
      expect(config.params).toEqual({});
      expect(config.headers?.Authorization).toBeUndefined();
      expect(config.headers?.Sign).toBeUndefined();
      return [200, paymentMethodsFixture];
    });

    const result = await paymentMethods.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(6);
    expect(result[0]).toEqual({
      payment: 1,
      currency: "CLP",
      name: "Webpay plus",
      description: "Visa, Mastercard, Magna, American, Diners y Redcompra.",
    });
  });

  test("list with currency sends GET /paymentmethods?currency=clp", async () => {
    mock.onGet("/paymentmethods").reply((config) => {
      expect(config.params).toEqual({ currency: "clp" });
      expect(config.headers?.Authorization).toBeUndefined();
      expect(config.headers?.Sign).toBeUndefined();
      return [200, paymentMethodsFixture];
    });

    const result = await paymentMethods.list({ currency: "CLP" });

    expect(result).toHaveLength(6);
    const mach = result.find((m) => m.payment === 9);
    expect(mach?.name).toBe("MACH");
  });

  describe("defensive guard (response.payment_methods missing or anomalous)", () => {
    test("returns empty array if response.payment_methods is undefined", async () => {
      mock.onGet("/paymentmethods").reply(200, {
        status: "success",
      });

      const result = await paymentMethods.list({ currency: "clp" });
      expect(result).toEqual([]);
    });

    test("returns empty array if response.payment_methods is null", async () => {
      mock.onGet("/paymentmethods").reply(200, {
        status: "success",
        payment_methods: null,
      });

      const result = await paymentMethods.list({ currency: "clp" });
      expect(result).toEqual([]);
    });

    test("returns empty array if response is empty object", async () => {
      mock.onGet("/paymentmethods").reply(200, {});

      const result = await paymentMethods.list({ currency: "clp" });
      expect(result).toEqual([]);
    });
  });

  describe("PaykuScopedPaymentMethods (forCountry integration)", () => {
    test("infers CLP currency automatically for Chile when called without arguments", async () => {
      const scopedPaymentMethods = new PaykuScopedPaymentMethods(paymentMethods, "CL");

      mock.onGet("/paymentmethods").reply((config) => {
        expect(config.params).toEqual({ currency: "clp" });
        return [200, paymentMethodsFixture];
      });

      const result = await scopedPaymentMethods.list();
      expect(result).toHaveLength(6);
    });

    test("infers PEN currency automatically for Peru", async () => {
      const scopedPaymentMethods = new PaykuScopedPaymentMethods(paymentMethods, "PE");

      mock.onGet("/paymentmethods").reply((config) => {
        expect(config.params).toEqual({ currency: "pen" });
        return [200, { status: "success", payment_methods: [] }];
      });

      const result = await scopedPaymentMethods.list();
      expect(result).toEqual([]);
    });

    test("infers VES currency automatically for Venezuela", async () => {
      const scopedPaymentMethods = new PaykuScopedPaymentMethods(paymentMethods, "VE");

      mock.onGet("/paymentmethods").reply((config) => {
        expect(config.params).toEqual({ currency: "ves" });
        return [200, { status: "success", payment_methods: [] }];
      });

      const result = await scopedPaymentMethods.list();
      expect(result).toEqual([]);
    });

    test("allows explicit currency override in scoped payment methods", async () => {
      const scopedPaymentMethods = new PaykuScopedPaymentMethods(paymentMethods, "CL");

      mock.onGet("/paymentmethods").reply((config) => {
        expect(config.params).toEqual({ currency: "pen" });
        return [200, { status: "success", payment_methods: [] }];
      });

      const result = await scopedPaymentMethods.list({ currency: "pen" });
      expect(result).toEqual([]);
    });

    test("Payku.forCountry('CL').paymentMethods is an instance of PaykuScopedPaymentMethods", () => {
      const paykuChile = Payku.forCountry("CL", {
        publicToken: "public-token",
        privateToken: "private-token",
        environment: "sandbox",
      });

      expect(paykuChile.paymentMethods).toBeInstanceOf(PaykuScopedPaymentMethods);
    });
  });
});
