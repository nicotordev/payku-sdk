import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import Payku, {
  PaykuPaymentMethods as PaykuPaymentMethodsExport,
} from "../index";
import PaykuPaymentMethods from "../clients/payku.payment-methods";
import { PaykuScopedPaymentMethods } from "../clients/payku.payment-methods.scoped";
import { PaykuError } from "../errors";
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
      const scopedPaymentMethods = new PaykuScopedPaymentMethods(
        paymentMethods,
        "CL",
      );

      mock.onGet("/paymentmethods").reply((config) => {
        expect(config.params).toEqual({ currency: "clp" });
        return [200, paymentMethodsFixture];
      });

      const result = await scopedPaymentMethods.list();
      expect(result).toHaveLength(6);
    });

    test("infers PEN currency automatically for Peru", async () => {
      const scopedPaymentMethods = new PaykuScopedPaymentMethods(
        paymentMethods,
        "PE",
      );

      mock.onGet("/paymentmethods").reply((config) => {
        expect(config.params).toEqual({ currency: "pen" });
        return [200, { status: "success", payment_methods: [] }];
      });

      const result = await scopedPaymentMethods.list();
      expect(result).toEqual([]);
    });

    test("infers VES currency automatically for Venezuela", async () => {
      const scopedPaymentMethods = new PaykuScopedPaymentMethods(
        paymentMethods,
        "VE",
      );

      mock.onGet("/paymentmethods").reply((config) => {
        expect(config.params).toEqual({ currency: "ves" });
        return [200, { status: "success", payment_methods: [] }];
      });

      const result = await scopedPaymentMethods.list();
      expect(result).toEqual([]);
    });

    test("allows explicit currency override in scoped payment methods", async () => {
      const scopedPaymentMethods = new PaykuScopedPaymentMethods(
        paymentMethods,
        "CL",
      );

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

      expect(paykuChile.paymentMethods).toBeInstanceOf(
        PaykuScopedPaymentMethods,
      );
    });
  });

  describe("toSlug and resolve", () => {
    test("static and instance methods share the catalog helpers", () => {
      expect(PaykuPaymentMethods.toSlug(1)).toBe("webpay");
      expect(PaykuPaymentMethods.resolve("webpay")).toBe(1);
      expect(paymentMethods.toSlug(17)).toBe("vepuy");
      expect(paymentMethods.resolve("safety_pay")).toBe(20);
      expect(paymentMethods.toSlug(1, "CLP")).toBe("webpay");
      expect(paymentMethods.toSlug(1, "PEN")).toBeUndefined();
      expect(paymentMethods.toSlug(30)).toBe("granve");
      expect(paymentMethods.toSlug(999)).toBeUndefined();
      expect(paymentMethods.resolve(1)).toBe(1);
      expect(() => paymentMethods.resolve("paypal")).toThrow(PaykuError);
      expect(() => paymentMethods.resolve(1.5)).toThrow(PaykuError);
      expect(() => paymentMethods.resolve("vepuy", "CLP")).toThrow(/CLP/);
    });

    test("keeps toSlug and resolve usable after destructuring", () => {
      const { toSlug, resolve } = paymentMethods;

      expect(toSlug(29, "PEN")).toBe("alix");
      expect(resolve("atix", "PEN")).toBe(29);
    });

    test("scoped methods use the country currency unless overridden", () => {
      const chile = new PaykuScopedPaymentMethods(paymentMethods, "CL");

      expect(chile.toSlug(1)).toBe("webpay");
      expect(chile.resolve("webpay")).toBe(1);
      expect(chile.toSlug(17)).toBeUndefined();
      expect(() => chile.resolve("vepuy")).toThrow(PaykuError);
      expect(chile.resolve("safety_pay", "PEN")).toBe(20);

      const { toSlug, resolve } = chile;
      expect(toSlug(19)).toBe("fintoc");
      expect(resolve("mach")).toBe(9);
    });

    test("forCountry payment methods resolve against that country", () => {
      const chile = Payku.forCountry("CL", {
        publicToken: "public-token",
        privateToken: "private-token",
      });

      expect(chile.paymentMethods.toSlug(1)).toBe("webpay");
      expect(chile.paymentMethods.resolve("webpay")).toBe(1);
      expect(PaykuPaymentMethodsExport.toSlug(17)).toBe("vepuy");
    });
  });
});
