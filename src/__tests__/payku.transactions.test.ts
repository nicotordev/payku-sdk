import { URL } from "node:url";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import Payku, { PaykuChile } from "../clients/payku";
import PaykuTransactions from "../clients/payku.transactions";
import { PaykuChileTransactions } from "../clients/payku.transactions.scoped";
import { PaykuError } from "../errors";
import { HttpClient } from "../http/client";
import { PAYKU_PAYMENT_METHODS } from "../constants/payku.constants";
import * as PaykuSDK from "../index";
import {
  formatPaykuExpired,
  formatPaykuExpiredInSantiago,
  normalizePaykuRut,
  normalizeRut,
  parsePaykuExpiredInSantiago,
  parsePaymentReturnQuery,
  paymentMethodToSlug,
  resolvePaymentMethod,
  validateChileCreateTransactionRequest,
  validateCreateTransactionRequest,
} from "../utils/payku.utils";
import createSuccessFixture from "./fixtures/chile/transactions/create-success.json";
import createInvalid400Fixture from "./fixtures/chile/transactions/create-invalid-400.json";
import createUnauthorized401Fixture from "./fixtures/chile/transactions/create-unauthorized-401.json";
import getSuccessFixture from "./fixtures/chile/transactions/get-success.json";
import getNotFound404Fixture from "./fixtures/chile/transactions/get-not-found-404.json";
import listSuccessFixture from "./fixtures/chile/transactions/list-success.json";
import listEmptyNoRecordsFixture from "./fixtures/chile/transactions/list-empty-no-records.json";


const chileCreateBase = {
  email: "cliente@example.com",
  order: "orden-001",
  subject: "Test",
  amount: 1000,
  urlreturn: "https://example.com/return",
  urlnotify: "https://example.com/notify",
};

/** Formatea un instante como wall-clock America/Santiago (`YYYY-MM-DD HH:mm:ss`). */
function formatSantiagoWallClock(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

describe("validateCreateTransactionRequest", () => {
  test("rejects non-positive amounts", () => {
    expect(() =>
      validateCreateTransactionRequest({
        amount: 0,
        currency: "CLP",
      }),
    ).toThrow("amount must be greater than 0");
  });

  test("rejects invalid payment codes for currency", () => {
    expect(() =>
      validateCreateTransactionRequest({
        amount: 1000,
        currency: "CLP",
        payment: 20,
      }),
    ).toThrow("payment 20 is not valid for currency CLP");
  });

  test("accepts payment slugs and rejects unknown slugs", () => {
    expect(() =>
      validateCreateTransactionRequest({
        amount: 1000,
        currency: "CLP",
        payment: "webpay",
      }),
    ).not.toThrow();

    expect(() =>
      validateCreateTransactionRequest({
        amount: 1000,
        currency: "CLP",
        payment: "etpay",
        additional_parameters: { payer_rut: "11111111-1" },
      }),
    ).not.toThrow();

    expect(() =>
      validateCreateTransactionRequest({
        amount: 1000,
        currency: "PEN",
        payment: "safety_pay",
      }),
    ).not.toThrow();

    expect(() =>
      validateCreateTransactionRequest({
        amount: 1000,
        currency: "CLP",
        payment: "safety_pay",
      }),
    ).toThrow('payment slug "safety_pay" is not valid for currency CLP');
  });

  test("requires payer_rut for CLP etpay slug", () => {
    expect(() =>
      validateCreateTransactionRequest({
        amount: 1000,
        currency: "CLP",
        payment: "etpay",
      }),
    ).toThrow("additional_parameters.payer_rut is required");
  });

  test("rejects CLP Etpay/Fintoc/Floid without payer_rut", () => {
    for (const payment of [4, 19, 26]) {
      expect(() =>
        validateCreateTransactionRequest({
          amount: 1000,
          currency: "CLP",
          payment,
        }),
      ).toThrow("additional_parameters.payer_rut is required");
    }
  });

  test("accepts CLP Etpay with payer_rut", () => {
    expect(() =>
      validateCreateTransactionRequest({
        amount: 1000,
        currency: "CLP",
        payment: 4,
        additional_parameters: { payer_rut: "11111111-1" },
      }),
    ).not.toThrow();
  });

  test("rejects unknown VES gateways", () => {
    expect(() =>
      validateCreateTransactionRequest({
        amount: 100,
        currency: "VES",
        additional_parameters: { gateway: "INVALID" },
      }),
    ).toThrow("Unknown VES gateway: INVALID");
  });

  test("accepts catalog-only CLP codes by default (Full/Klap)", () => {
    expect(() =>
      validateCreateTransactionRequest({
        amount: 1000,
        currency: "CLP",
        payment: 14,
      }),
    ).not.toThrow();
  });

  test("rejects catalog-only CLP codes when clpPaymentCodes is create-docs", () => {
    expect(() =>
      validateCreateTransactionRequest(
        {
          amount: 1000,
          currency: "CLP",
          payment: 14,
        },
        { clpPaymentCodes: "create-docs" },
      ),
    ).toThrow("payment 14 is not valid for currency CLP");
  });

  test("rejects expired without urlreturn", () => {
    expect(() =>
      validateCreateTransactionRequest({
        amount: 1000,
        currency: "CLP",
        expired: "2099-01-01 12:00:00",
      }),
    ).toThrow("urlreturn is required when expired is set");
  });

  test("rejects expired with invalid format", () => {
    expect(() =>
      validateCreateTransactionRequest({
        amount: 1000,
        currency: "CLP",
        expired: "2099-01-01T12:00:00",
        urlreturn: "https://example.com/return",
      }),
    ).toThrow("expired must use format YYYY-MM-DD HH:mm:ss");
  });

  test("rejects blank or whitespace expired as invalid (not omitted)", () => {
    for (const expired of ["", "   "]) {
      expect(() =>
        validateCreateTransactionRequest({
          amount: 1000,
          currency: "CLP",
          expired,
          urlreturn: "https://example.com/return",
        }),
      ).toThrow("expired must use format YYYY-MM-DD HH:mm:ss");
    }
  });

  test("rejects expired within 5 minutes of now (Santiago)", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const tooSoon = formatSantiagoWallClock(
      new Date(now.getTime() + 2 * 60 * 1000),
    );

    expect(() =>
      validateCreateTransactionRequest(
        {
          amount: 1000,
          currency: "CLP",
          expired: tooSoon,
          urlreturn: "https://example.com/return",
        },
        { now },
      ),
    ).toThrow(
      "expired must be more than 5 minutes after the current time (America/Santiago)",
    );
  });

  test("accepts expired more than 5 minutes ahead with urlreturn", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const ok = formatSantiagoWallClock(
      new Date(now.getTime() + 10 * 60 * 1000),
    );

    expect(() =>
      validateCreateTransactionRequest(
        {
          amount: 1000,
          currency: "CLP",
          expired: ok,
          urlreturn: "https://example.com/return",
        },
        { now },
      ),
    ).not.toThrow();
  });

  test("accepts expired as relative duration ({ minutes: 30 })", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    expect(() =>
      validateCreateTransactionRequest(
        {
          amount: 1000,
          currency: "CLP",
          expired: { minutes: 30 },
          urlreturn: "https://example.com/return",
        },
        { now },
      ),
    ).not.toThrow();
  });

  test("rejects expired relative duration within 5 minutes ({ minutes: 2 })", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    expect(() =>
      validateCreateTransactionRequest(
        {
          amount: 1000,
          currency: "CLP",
          expired: { minutes: 2 },
          urlreturn: "https://example.com/return",
        },
        { now },
      ),
    ).toThrow(
      "expired must be more than 5 minutes after the current time (America/Santiago)",
    );
  });

  test("accepts expired as Date instance ahead of 5 minutes", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const futureDate = new Date(now.getTime() + 20 * 60 * 1000);
    expect(() =>
      validateCreateTransactionRequest(
        {
          amount: 1000,
          currency: "CLP",
          expired: futureDate,
          urlreturn: "https://example.com/return",
        },
        { now },
      ),
    ).not.toThrow();
  });

  test("accepts direct payerRut for CLP payments requiring payer_rut", () => {
    expect(() =>
      validateCreateTransactionRequest({
        amount: 1000,
        currency: "CLP",
        payment: 19,
        payerRut: "18.765.432-1",
      }),
    ).not.toThrow();
  });

  test("rejects invalid duration format in expired", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    expect(() =>
      validateCreateTransactionRequest(
        {
          amount: 1000,
          currency: "CLP",
          expired: { minutes: -10 } as unknown as { minutes: number },
          urlreturn: "https://example.com/return",
        },
        { now },
      ),
    ).toThrow("expired duration must contain positive numeric values");
  });
});

describe("normalizeRut", () => {
  test("cleans dots and surrounding whitespace", () => {
    expect(normalizeRut("  18.765.432-1  ")).toBe("18765432-1");
  });

  test("normalizes lowercase 'k' to uppercase 'K'", () => {
    expect(normalizeRut("18.765.432-k")).toBe("18765432-K");
    expect(normalizeRut("18765432-k")).toBe("18765432-K");
    expect(normalizeRut("18765432k")).toBe("18765432-K");
  });

  test("inserts hyphen before verification digit when omitted", () => {
    expect(normalizeRut("187654321")).toBe("18765432-1");
    expect(normalizeRut("7654321k")).toBe("7654321-K");
    expect(normalizeRut("76543212")).toBe("7654321-2");
  });

  test("keeps already normalized RUT intact", () => {
    expect(normalizeRut("18765432-1")).toBe("18765432-1");
    expect(normalizeRut("18765432-K")).toBe("18765432-K");
  });

  test("handles empty and whitespace strings", () => {
    expect(normalizeRut("")).toBe("");
    expect(normalizeRut("   ")).toBe("");
  });

  test("normalizePaykuRut is an alias to normalizeRut", () => {
    expect(normalizePaykuRut("18.765.432-1")).toBe("18765432-1");
  });
});

describe("formatPaykuExpiredInSantiago", () => {
  const fixedNow = new Date("2026-09-20T16:00:00.000Z"); // Santiago (UTC-3) => 13:00

  test("formats minutes duration", () => {
    expect(formatPaykuExpiredInSantiago({ minutes: 30 }, fixedNow)).toBe(
      "2026-09-20 13:30",
    );
  });

  test("formats hours duration", () => {
    expect(formatPaykuExpiredInSantiago({ hours: 2 }, fixedNow)).toBe(
      "2026-09-20 15:00",
    );
  });

  test("formats days duration", () => {
    expect(formatPaykuExpiredInSantiago({ days: 1 }, fixedNow)).toBe(
      "2026-09-21 13:00",
    );
  });

  test("formats combined duration (days and hours)", () => {
    expect(
      formatPaykuExpiredInSantiago({ days: 1, hours: 2, minutes: 15 }, fixedNow),
    ).toBe("2026-09-21 15:15");
  });

  test("formats Date instance into America/Santiago wall-clock YYYY-MM-DD HH:mm", () => {
    const date = new Date("2026-12-31T23:59:00.000Z"); // Santiago UTC-3 => 20:59
    expect(formatPaykuExpiredInSantiago(date)).toBe("2026-12-31 20:59");
  });

  test("trims and returns existing string", () => {
    expect(formatPaykuExpiredInSantiago("  2026-12-31 23:59  ")).toBe(
      "2026-12-31 23:59",
    );
  });

  test("rejects non-positive durations", () => {
    expect(() =>
      formatPaykuExpiredInSantiago({ minutes: 0 }, fixedNow),
    ).toThrow("expired duration must contain positive numeric values");
    expect(() =>
      formatPaykuExpiredInSantiago({ minutes: -5 }, fixedNow),
    ).toThrow("expired duration must contain positive numeric values");
    expect(() =>
      formatPaykuExpiredInSantiago({} as { minutes: number }, fixedNow),
    ).toThrow("expired duration must contain positive numeric values");
  });

  test("rejects invalid Date instance", () => {
    expect(() => formatPaykuExpiredInSantiago(new Date(NaN))).toThrow(
      "expired is not a valid date",
    );
  });

  test("formatPaykuExpired alias behaves identically", () => {
    expect(formatPaykuExpired({ minutes: 30 }, fixedNow)).toBe(
      "2026-09-20 13:30",
    );
  });
});

describe("parsePaykuExpiredInSantiago", () => {
  test("round-trips a Santiago wall-clock instant with seconds", () => {
    const expired = "2023-10-19 13:05:10";
    const parsed = parsePaykuExpiredInSantiago(expired);
    expect(formatSantiagoWallClock(parsed)).toBe(expired);
  });

  test("parses Santiago wall-clock instant without seconds (YYYY-MM-DD HH:mm)", () => {
    const expired = "2026-12-31 23:59";
    const parsed = parsePaykuExpiredInSantiago(expired);
    expect(parsed).toBeInstanceOf(Date);
    expect(formatPaykuExpiredInSantiago(parsed)).toBe(expired);
  });
});

describe("validateChileCreateTransactionRequest", () => {
  test("rejects missing required fields", () => {
    expect(() =>
      validateChileCreateTransactionRequest({
        ...chileCreateBase,
        email: "",
      }),
    ).toThrow("email is required");
  });

  test("accepts complete Chile request with optional payment", () => {
    expect(() =>
      validateChileCreateTransactionRequest({
        ...chileCreateBase,
        payment: 1,
      }),
    ).not.toThrow();
  });

  test("rejects Chile create when expired is too soon", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const tooSoon = formatSantiagoWallClock(
      new Date(now.getTime() + 60 * 1000),
    );

    expect(() =>
      validateChileCreateTransactionRequest(
        {
          ...chileCreateBase,
          expired: tooSoon,
        },
        { now },
      ),
    ).toThrow(
      "expired must be more than 5 minutes after the current time (America/Santiago)",
    );
  });

  test("accepts Chile create with relative expired ({ minutes: 30 })", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    expect(() =>
      validateChileCreateTransactionRequest(
        {
          ...chileCreateBase,
          expired: { minutes: 30 },
        },
        { now },
      ),
    ).not.toThrow();
  });

  test("rejects Chile create with relative expired too soon ({ minutes: 2 })", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    expect(() =>
      validateChileCreateTransactionRequest(
        {
          ...chileCreateBase,
          expired: { minutes: 2 },
        },
        { now },
      ),
    ).toThrow(
      "expired must be more than 5 minutes after the current time (America/Santiago)",
    );
  });

  test("accepts Chile create with direct payerRut for Fintoc (19)", () => {
    expect(() =>
      validateChileCreateTransactionRequest({
        ...chileCreateBase,
        payment: 19,
        payerRut: "18.765.432-1",
      }),
    ).not.toThrow();
  });
});

describe("PaykuChileTransactions", () => {
  let mock: MockAdapter;
  let apiAxios: ReturnType<typeof axios.create>;
  let chileTransactions: PaykuChileTransactions;

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

    chileTransactions = new PaykuChileTransactions(new PaykuTransactions(http));
  });

  afterEach(() => {
    mock.restore();
  });

  test("create rejects missing urlnotify before HTTP", async () => {
    await expect(
      chileTransactions.create({
        ...chileCreateBase,
        urlnotify: "",
      }),
    ).rejects.toBeInstanceOf(PaykuError);
    expect(mock.history.post).toHaveLength(0);
  });

  test("create posts CLP body with Fintoc payer_rut", async () => {
    mock.onPost("/transaction").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body.currency).toBe("CLP");
      expect(body.payment).toBe(19);
      expect(body).toMatchObject({
        additional_parameters: { payer_rut: "11111111-1" },
      });
      return [
        200,
        {
          status: "pending",
          id: "tx-cl",
          url: "https://des.payku.cl/checkout/tx-cl",
        },
      ];
    });

    const response = await chileTransactions.create({
      ...chileCreateBase,
      payment: 19,
      additional_parameters: { payer_rut: "11111111-1" },
    });

    expect(response.id).toBe("tx-cl");
  });

  test("create resolves payment slugs to numeric wire codes", async () => {
    mock.onPost("/transaction").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body.payment).toBe(1);
      expect(body.currency).toBe("CLP");
      return [
        200,
        {
          status: "pending",
          id: "tx-slug",
          url: "https://des.payku.cl/checkout/tx-slug",
        },
      ];
    });

    const response = await chileTransactions.create({
      ...chileCreateBase,
      payment: "webpay",
    });

    expect(response.id).toBe("tx-slug");
  });

  test("create posts CLP body with direct payerRut normalized and injected in additional_parameters", async () => {
    mock.onPost("/transaction").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body.currency).toBe("CLP");
      expect(body.payment).toBe(19);
      expect(body.additional_parameters).toEqual({
        payer_rut: "18765432-1",
      });
      expect(body.payerRut).toBeUndefined();
      return [
        200,
        {
          status: "pending",
          id: "tx-cl-rut",
          url: "https://des.payku.cl/checkout/tx-cl-rut",
        },
      ];
    });

    const response = await chileTransactions.create({
      ...chileCreateBase,
      payment: 19,
      payerRut: "18.765.432-1",
    });

    expect(response.id).toBe("tx-cl-rut");
  });

  test("create posts CLP body with lowercase k in payerRut normalized to K", async () => {
    mock.onPost("/transaction").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body.additional_parameters).toEqual({
        payer_rut: "18765432-K",
      });
      return [
        200,
        {
          status: "pending",
          id: "tx-cl-k",
          url: "https://des.payku.cl/checkout/tx-cl-k",
        },
      ];
    });

    const response = await chileTransactions.create({
      ...chileCreateBase,
      payment: 19,
      payerRut: "  18.765.432-k  ",
    });

    expect(response.id).toBe("tx-cl-k");
  });

  test("create posts CLP body with expired duration formatted in Santiago timezone", async () => {
    const fixedNow = new Date("2026-09-20T16:00:00.000Z"); // 13:00 Santiago

    mock.onPost("/transaction").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body.expired).toBe("2026-09-20 13:30");
      return [
        200,
        {
          status: "pending",
          id: "tx-cl-exp",
          url: "https://des.payku.cl/checkout/tx-cl-exp",
        },
      ];
    });

    const response = await chileTransactions.create(
      {
        ...chileCreateBase,
        expired: { minutes: 30 },
      },
      { now: fixedNow },
    );

    expect(response.id).toBe("tx-cl-exp");
  });

  test("create posts CLP body with expired Date formatted in Santiago timezone", async () => {
    const fixedDate = new Date("2026-12-31T23:59:00.000Z"); // 20:59 Santiago

    mock.onPost("/transaction").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body.expired).toBe("2026-12-31 20:59");
      return [
        200,
        {
          status: "pending",
          id: "tx-cl-date",
          url: "https://des.payku.cl/checkout/tx-cl-date",
        },
      ];
    });

    const response = await chileTransactions.create(
      {
        ...chileCreateBase,
        expired: fixedDate,
      },
      { now: new Date("2026-12-31T18:00:00.000Z") },
    );

    expect(response.id).toBe("tx-cl-date");
  });

  test("create respects clpPaymentCodes option when set to create-docs", async () => {
    await expect(
      chileTransactions.create(
        {
          ...chileCreateBase,
          payment: 14,
        },
        { clpPaymentCodes: "create-docs" },
      ),
    ).rejects.toThrow("payment 14 is not valid for currency CLP");
    expect(mock.history.post).toHaveLength(0);
  });

  test("create accepts catalog CLP code by default", async () => {
    mock.onPost("/transaction").reply(200, {
      status: "pending",
      id: "tx-cl-14",
    });

    const response = await chileTransactions.create({
      ...chileCreateBase,
      payment: 14,
    });
    expect(response.id).toBe("tx-cl-14");
    expect(mock.history.post).toHaveLength(1);
  });
});

describe("Payku.forCountry CL transactions", () => {
  test("PaykuChile uses PaykuChileTransactions", () => {
    const payku = Payku.forCountry("CL", {
      publicToken: "public",
      privateToken: "private",
      environment: "sandbox",
    });

    expect(payku).toBeInstanceOf(PaykuChile);
    expect(payku.transactions).toBeInstanceOf(PaykuChileTransactions);
  });
});

describe("PaykuTransactions HTTP", () => {
  let mock: MockAdapter;
  let apiAxios: ReturnType<typeof axios.create>;
  let transactions: PaykuTransactions;

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

    transactions = new PaykuTransactions(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create posts to /transaction with bearer auth", async () => {
    mock.onPost("/transaction").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");

      return [
        200,
        {
          status: "pending",
          id: "tx-123",
          url: "https://des.payku.cl/checkout/tx-123",
        },
      ];
    });

    const response = await transactions.create({
      email: "cliente@example.com",
      order: "orden-001",
      subject: "Test",
      amount: 1000,
      currency: "CLP",
      payment: 1,
    });

    expect(response.id).toBe("tx-123");
    expect(response.status).toBe("pending");
  });

  test("list parses transaction array from API envelope", async () => {
    mock.onGet("/transaction").reply(200, {
      transaction: [{ id: "tx-1", status: "success", amount: 1000 }],
    });

    const items = await transactions.list({ page: 1 });

    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("tx-1");
  });

  test("list forwards filters and rejects per_page above 4000", async () => {
    mock.onGet("/transaction").reply((config) => {
      expect(config.params).toMatchObject({
        page: 1,
        per_page: 100,
        date_init: "2021-09-01",
        date_end: "2021-09-15",
        success: true,
      });
      return [
        200,
        {
          transaction: [{ id: "tx-ok", status: "success", amount: 500 }],
        },
      ];
    });

    const items = await transactions.list({
      page: 1,
      per_page: 100,
      date_init: "2021-09-01",
      date_end: "2021-09-15",
      success: true,
    });

    expect(items[0]?.id).toBe("tx-ok");

    await expect(transactions.list({ per_page: 4001 })).rejects.toThrow(
      "per_page must be between 1 and 4000",
    );
    expect(mock.history.get).toHaveLength(1);
  });

  test("create respects clpPaymentCodes option when set to create-docs", async () => {
    await expect(
      transactions.create(
        {
          email: "cliente@example.com",
          order: "orden-001",
          subject: "Test",
          amount: 1000,
          currency: "CLP",
          payment: 14,
        },
        { clpPaymentCodes: "create-docs" },
      ),
    ).rejects.toThrow("payment 14 is not valid for currency CLP");
    expect(mock.history.post).toHaveLength(0);
  });

  test("get throws PaykuError on failed business response", async () => {
    mock.onGet("/transaction/missing").reply(404, {
      status: "failed",
      type: "Not Found",
      message_error: "Transaction not found",
    });

    await expect(transactions.get("missing")).rejects.toBeInstanceOf(
      PaykuError,
    );
  });
});

describe("PAYKU_PAYMENT_METHODS PEN aliases", () => {
  test("defines ALIX and deprecated ATIX alias with the same code", () => {
    expect(PAYKU_PAYMENT_METHODS.PEN.ALIX).toBe(29);
    expect(PAYKU_PAYMENT_METHODS.PEN.ATIX).toBe(29);
  });
});

describe("resolvePaymentMethod", () => {
  test("resolves CLP, PEN and VES slugs to catalog codes", () => {
    expect(resolvePaymentMethod("webpay", "CLP")).toBe(1);
    expect(resolvePaymentMethod("fintoc", "CLP")).toBe(19);
    expect(resolvePaymentMethod("WEBPAY_1_3", "CLP")).toBe(100);
    expect(resolvePaymentMethod("safety_pay", "PEN")).toBe(20);
    expect(resolvePaymentMethod("atix", "PEN")).toBe(29);
    expect(resolvePaymentMethod("vepuy", "VES")).toBe(17);
  });

  test("passes numeric codes through", () => {
    expect(resolvePaymentMethod(1, "CLP")).toBe(1);
    expect(resolvePaymentMethod(29, "PEN")).toBe(29);
  });

  test("rejects unknown slugs and slugs for the wrong currency", () => {
    expect(() => resolvePaymentMethod("paypal", "CLP")).toThrow(
      'payment slug "paypal" is not valid for currency CLP',
    );
    expect(() => resolvePaymentMethod("webpay", "PEN")).toThrow(
      'payment slug "webpay" is not valid for currency PEN',
    );
  });

  test("maps codes back to the canonical slug", () => {
    expect(paymentMethodToSlug(1, "CLP")).toBe("webpay");
    expect(paymentMethodToSlug(29, "PEN")).toBe("alix");
    expect(paymentMethodToSlug(17, "VES")).toBe("vepuy");
  });
});

describe("SDK entrypoint exports", () => {
  test("exports validation and formatting functions", () => {
    expect(typeof PaykuSDK.validateCreateTransactionRequest).toBe("function");
    expect(typeof PaykuSDK.validateChileCreateTransactionRequest).toBe("function");
    expect(typeof PaykuSDK.parsePaymentReturnQuery).toBe("function");
    expect(typeof PaykuSDK.formatPaykuExpiredInSantiago).toBe("function");
    expect(typeof PaykuSDK.formatPaykuExpired).toBe("function");
    expect(typeof PaykuSDK.normalizeRut).toBe("function");
    expect(typeof PaykuSDK.normalizePaykuRut).toBe("function");
    expect(typeof PaykuSDK.parsePaykuExpiredInSantiago).toBe("function");
  });
});

describe("parsePaymentReturnQuery", () => {
  test("parses full URL string with expired message_error", () => {
    const url = "https://example.com/return?message_error=expired&id=trx123456";
    const result = parsePaymentReturnQuery(url);

    expect(result).toEqual({
      id: "trx123456",
      status: undefined,
      messageError: "expired",
      expired: true,
    });
  });

  test("parses partial query string", () => {
    const query = "id=trx789&message_error=expired";
    const result = parsePaymentReturnQuery(query);

    expect(result.id).toBe("trx789");
    expect(result.expired).toBe(true);
  });

  test("parses URLSearchParams instance", () => {
    const params = new URLSearchParams({
      id: "trx-sp",
      status: "expired",
    });
    const result = parsePaymentReturnQuery(params);

    expect(result.id).toBe("trx-sp");
    expect(result.status).toBe("expired");
    expect(result.expired).toBe(true);
  });

  test("parses object record (e.g. Next.js query / searchParams)", () => {
    const reqQuery = {
      id: "trx-next",
      message_error: "expired",
    };
    const result = parsePaymentReturnQuery(reqQuery);

    expect(result.id).toBe("trx-next");
    expect(result.messageError).toBe("expired");
    expect(result.expired).toBe(true);
  });

  test("returns expired: false for non-expired success return query", () => {
    const reqQuery = {
      id: "trx-ok",
      status: "success",
    };
    const result = parsePaymentReturnQuery(reqQuery);

    expect(result.id).toBe("trx-ok");
    expect(result.status).toBe("success");
    expect(result.expired).toBe(false);
  });

  test("strips URL hash fragment from param values", () => {
    const url = "https://example.com/return?id=trx123456&message_error=expired#section";
    const result = parsePaymentReturnQuery(url);

    expect(result.id).toBe("trx123456");
    expect(result.expired).toBe(true);
  });

  test("avoids false positives like message_error=not_expired", () => {
    const result = parsePaymentReturnQuery("id=trx-99&message_error=not_expired");

    expect(result.id).toBe("trx-99");
    expect(result.expired).toBe(false);
  });

  test("parses URL instance", () => {
    const url = new URL("https://example.com/return?id=trx-url-1&status=success");
    const result = parsePaymentReturnQuery(url);

    expect(result.id).toBe("trx-url-1");
    expect(result.status).toBe("success");
    expect(result.expired).toBe(false);
  });
});

describe("transactions.handleReturn", () => {
  let mock: MockAdapter;
  let apiAxios: ReturnType<typeof axios.create>;
  let transactions: PaykuTransactions;
  let chileTransactions: PaykuChileTransactions;

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

    transactions = new PaykuTransactions(http);
    chileTransactions = new PaykuChileTransactions(transactions);
  });

  afterEach(() => {
    mock.restore();
  });

  test("returns isExpired: true immediately without calling API when session expired", async () => {
    const url = "https://example.com/checkout/return?message_error=expired&id=trx-exp-1";
    const result = await transactions.handleReturn(url);

    expect(result).toEqual({
      id: "trx-exp-1",
      isExpired: true,
      isPaid: false,
      isPending: false,
      isFailed: false,
      rawStatus: "expired",
    });
    expect(mock.history.get).toHaveLength(0);
  });

  test("returns isPaid: true with transaction details when payment succeeded", async () => {
    mock.onGet("/transaction/trx-paid-1").reply(200, {
      id: "trx-paid-1",
      status: "success",
      order: "ORD-999",
      amount: 15000,
    });

    const url = "https://example.com/checkout/return?id=trx-paid-1&status=success";
    const result = await transactions.handleReturn(url);

    expect(result.id).toBe("trx-paid-1");
    expect(result.isPaid).toBe(true);
    expect(result.isPending).toBe(false);
    expect(result.isFailed).toBe(false);
    expect(result.isExpired).toBe(false);
    expect(result.rawStatus).toBe("success");
    expect(result.transaction?.order).toBe("ORD-999");
    expect(mock.history.get).toHaveLength(1);
  });

  test("encodes the transaction id before looking up the return", async () => {
    const id = "../account?scope=all&active=true";
    const encodedId = encodeURIComponent(id);
    mock.onGet(`/transaction/${encodedId}`).reply(200, {
      id,
      status: "success",
    });

    const result = await transactions.handleReturn({ id, status: "pending" });

    expect(result.id).toBe(id);
    expect(result.isPaid).toBe(true);
    expect(mock.history.get[0]?.url).toBe(`/transaction/${encodedId}`);
  });

  test("returns isPending: true when payment is pending or register", async () => {
    mock.onGet("/transaction/trx-pend-1").reply(200, {
      id: "trx-pend-1",
      status: "pending",
      order: "ORD-PEND",
    });

    const result = await transactions.handleReturn("id=trx-pend-1&status=pending");

    expect(result.id).toBe("trx-pend-1");
    expect(result.isPaid).toBe(false);
    expect(result.isPending).toBe(true);
    expect(result.isFailed).toBe(false);
    expect(result.isExpired).toBe(false);
    expect(result.rawStatus).toBe("pending");
    expect(result.transaction?.id).toBe("trx-pend-1");
  });

  test("returns isPending: true when transaction status is register", async () => {
    mock.onGet("/transaction/trx-reg-1").reply(200, {
      id: "trx-reg-1",
      status: "register",
    });

    const result = await transactions.handleReturn("id=trx-reg-1");

    expect(result.isPending).toBe(true);
    expect(result.isPaid).toBe(false);
    expect(result.rawStatus).toBe("register");
  });

  test("returns isFailed: true when payment was rejected or failed", async () => {
    mock.onGet("/transaction/trx-fail-1").reply(200, {
      id: "trx-fail-1",
      status: "rejected",
    });

    const result = await transactions.handleReturn("id=trx-fail-1&status=failed");

    expect(result.id).toBe("trx-fail-1");
    expect(result.isPaid).toBe(false);
    expect(result.isPending).toBe(false);
    expect(result.isFailed).toBe(true);
    expect(result.isExpired).toBe(false);
    expect(result.rawStatus).toBe("rejected");
  });

  test("handles URLSearchParams input", async () => {
    mock.onGet("/transaction/trx-sp-1").reply(200, {
      id: "trx-sp-1",
      status: "success",
    });

    const params = new URLSearchParams({ id: "trx-sp-1", status: "success" });
    const result = await transactions.handleReturn(params);

    expect(result.isPaid).toBe(true);
    expect(result.id).toBe("trx-sp-1");
  });

  test("handles URL instance input", async () => {
    mock.onGet("/transaction/trx-url-inst").reply(200, {
      id: "trx-url-inst",
      status: "success",
    });

    const url = new URL("https://example.com/return?id=trx-url-inst&status=success");
    const result = await transactions.handleReturn(url);

    expect(result.isPaid).toBe(true);
    expect(result.id).toBe("trx-url-inst");
  });

  test("handles object record input (Next.js / Express)", async () => {
    mock.onGet("/transaction/trx-record").reply(200, {
      id: "trx-record",
      status: "success",
    });

    const reqQuery = { id: "trx-record", status: "success" };
    const result = await transactions.handleReturn(reqQuery);

    expect(result.isPaid).toBe(true);
    expect(result.id).toBe("trx-record");
  });

  test("evaluates flags from query alone when id is missing", async () => {
    const resultSuccess = await transactions.handleReturn({ status: "success" });
    expect(resultSuccess.isPaid).toBe(true);
    expect(resultSuccess.transaction).toBeUndefined();

    const resultPending = await transactions.handleReturn({ status: "pending" });
    expect(resultPending.isPending).toBe(true);

    const resultFailed = await transactions.handleReturn({ status: "failed" });
    expect(resultFailed.isFailed).toBe(true);
    expect(mock.history.get).toHaveLength(0);
  });

  test("PaykuChileTransactions delegates handleReturn seamlessly", async () => {
    mock.onGet("/transaction/trx-chile-1").reply(200, {
      id: "trx-chile-1",
      status: "success",
      order: "CHILE-ORD-1",
    });

    const result = await chileTransactions.handleReturn(
      "https://example.com/checkout/return?id=trx-chile-1&status=success",
    );

    expect(result.id).toBe("trx-chile-1");
    expect(result.isPaid).toBe(true);
    expect(result.transaction?.order).toBe("CHILE-ORD-1");
  });
});

describe("PaykuTransactions fixtures", () => {
  let mock: MockAdapter;
  let apiAxios: ReturnType<typeof axios.create>;
  let transactions: PaykuTransactions;

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

    transactions = new PaykuTransactions(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create success fixture (200 OK)", async () => {
    mock.onPost("/transaction").reply(200, createSuccessFixture);

    const response = await transactions.create({
      email: "cliente@example.com",
      order: "orden-001",
      subject: "Test",
      amount: 1000,
      currency: "CLP",
      payment: 1,
    });

    expect(response.id).toBe("trxa4f96cde9e4356908");
    expect(response.status).toBe("register");
    expect(response.url).toBe(
      "https://des.payku.cl/gateway/cobro?id=trxa4f96cde9e4356908&valid=ae28e12e29",
    );
  });

  test("create invalid fixture (400 Bad Request)", async () => {
    mock.onPost("/transaction").reply(400, createInvalid400Fixture);

    await expect(
      transactions.create({
        email: "cliente@example.com",
        order: "orden-001",
        subject: "Test",
        amount: 1000,
        currency: "CLP",
        payment: 1,
      }),
    ).rejects.toThrow();
  });

  test("create unauthorized fixture (401 Unauthorized)", async () => {
    mock.onPost("/transaction").reply(401, createUnauthorized401Fixture);

    await expect(
      transactions.create({
        email: "cliente@example.com",
        order: "orden-001",
        subject: "Test",
        amount: 1000,
        currency: "CLP",
        payment: 1,
      }),
    ).rejects.toThrow();
  });

  test("get success fixture (200 OK with payment and gateway_response)", async () => {
    mock.onGet("/transaction/trx123456").reply(200, getSuccessFixture);

    const response = await transactions.get("trx123456");

    expect(response.id).toBe("trx123456");
    expect(response.status).toBe("success");
    expect(response.amount).toBe(15000);
    expect(response.payment?.payment_key).toBe("webpay");
    expect(response.payment?.authorization_code).toBe("123456");
    expect(response.gateway_response?.status).toBe("success");
  });

  test("get not found fixture (404 Not Found)", async () => {
    mock.onGet("/transaction/trx-missing").reply(404, getNotFound404Fixture);

    await expect(transactions.get("trx-missing")).rejects.toThrow("it is not valid");
  });

  test("list success fixture (200 OK with mixed amount string/number)", async () => {
    mock.onGet("/transaction").reply(200, listSuccessFixture);

    const items = await transactions.list();

    expect(items).toHaveLength(2);
    expect(items[0]?.id).toBe("trx101");
    expect(items[0]?.amount).toBe("15000");
    expect(items[1]?.id).toBe("trx102");
    expect(items[1]?.amount).toBe(25000);
  });

  test("list empty fixture (There are no records)", async () => {
    mock.onGet("/transaction").reply(200, listEmptyNoRecordsFixture);

    const items = await transactions.list();

    expect(items).toEqual([]);
  });
});

describe("client defaults (issue #168)", () => {
  let axiosInstance: ReturnType<typeof axios.create>;
  let mock: MockAdapter;
  let http: HttpClient;

  beforeEach(() => {
    axiosInstance = axios.create({
      baseURL: "https://des.payku.cl/api",
    });
    mock = new MockAdapter(axiosInstance);
    http = new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl: "https://des.payku.cl",
      publicToken: "public-token",
      privateToken: "private-token",
      axiosInstance,
      rootAxiosInstance: axiosInstance,
    });
  });

  afterEach(() => {
    mock.restore();
  });

  test("uses defaults for urlreturn and urlnotify when omitted in transactions.create", async () => {
    mock.onPost("/transaction").reply((config) => {
      const data = JSON.parse(config.data);
      expect(data.urlreturn).toBe("https://default.example.com/return");
      expect(data.urlnotify).toBe("https://default.example.com/notify");
      return [200, createSuccessFixture];
    });

    const transactions = new PaykuTransactions(
      http,
      {},
      {
        urlreturn: "https://default.example.com/return",
        urlnotify: "https://default.example.com/notify",
      },
    );

    const res = await transactions.create({
      amount: 1000,
      currency: "CLP",
    });

    expect(res.id).toBe(createSuccessFixture.id);
  });

  test("explicit urlreturn overrides client default", async () => {
    mock.onPost("/transaction").reply((config) => {
      const data = JSON.parse(config.data);
      expect(data.urlreturn).toBe("https://override.example.com/return");
      expect(data.urlnotify).toBe("https://default.example.com/notify");
      return [200, createSuccessFixture];
    });

    const transactions = new PaykuTransactions(
      http,
      {},
      {
        urlreturn: "https://default.example.com/return",
        urlnotify: "https://default.example.com/notify",
      },
    );

    await transactions.create({
      amount: 1000,
      currency: "CLP",
      urlreturn: "https://override.example.com/return",
    });
  });

  test("Chile transactions.create works with client defaults without repeating urlreturn/urlnotify", async () => {
    mock.onPost("/transaction").reply((config) => {
      const data = JSON.parse(config.data);
      expect(data.urlreturn).toBe("https://default.example.com/return");
      expect(data.urlnotify).toBe("https://default.example.com/notify");
      expect(data.currency).toBe("CLP");
      return [200, createSuccessFixture];
    });

    const defaults = {
      urlreturn: "https://default.example.com/return",
      urlnotify: "https://default.example.com/notify",
    };
    const baseTransactions = new PaykuTransactions(http, {}, defaults);
    const chileTransactions = new PaykuChileTransactions(
      baseTransactions,
      defaults,
    );

    const res = await chileTransactions.create({
      email: "cliente@example.com",
      order: "orden-defaults",
      subject: "Pago defaults",
      amount: 5000,
    });

    expect(res.id).toBe(createSuccessFixture.id);
  });

  test("options.defaults overrides constructor defaults in HTTP payload", async () => {
    mock.onPost("/transaction").reply((config) => {
      const data = JSON.parse(config.data);
      expect(data.urlreturn).toBe("https://option.example.com/return");
      expect(data.urlnotify).toBe("https://option.example.com/notify");
      return [200, createSuccessFixture];
    });

    const transactions = new PaykuTransactions(
      http,
      {},
      {
        urlreturn: "https://constructor.example.com/return",
        urlnotify: "https://constructor.example.com/notify",
      },
    );

    await transactions.create(
      {
        amount: 1000,
        currency: "CLP",
      },
      {
        defaults: {
          urlreturn: "https://option.example.com/return",
          urlnotify: "https://option.example.com/notify",
        },
      },
    );
  });

  test("Chile transactions.create uses options.defaults over constructor defaults", async () => {
    mock.onPost("/transaction").reply((config) => {
      const data = JSON.parse(config.data);
      expect(data.urlreturn).toBe("https://chile-option.example.com/return");
      expect(data.urlnotify).toBe("https://chile-option.example.com/notify");
      expect(data.currency).toBe("CLP");
      return [200, createSuccessFixture];
    });

    const constructorDefaults = {
      urlreturn: "https://constructor.example.com/return",
      urlnotify: "https://constructor.example.com/notify",
    };
    const baseTransactions = new PaykuTransactions(
      http,
      {},
      constructorDefaults,
    );
    const chileTransactions = new PaykuChileTransactions(
      baseTransactions,
      constructorDefaults,
    );

    await chileTransactions.create(
      {
        email: "cliente@example.com",
        order: "orden-option-defaults",
        subject: "Pago option defaults",
        amount: 5000,
      },
      {
        defaults: {
          urlreturn: "https://chile-option.example.com/return",
          urlnotify: "https://chile-option.example.com/notify",
        },
      },
    );
  });

  test("Chile transactions.create fails when urlreturn is omitted and no defaults are configured", async () => {
    const baseTransactions = new PaykuTransactions(http);
    const chileTransactions = new PaykuChileTransactions(baseTransactions);

    await expect(
      chileTransactions.create({
        email: "cliente@example.com",
        order: "orden-defaults",
        subject: "Pago defaults",
        amount: 5000,
      }),
    ).rejects.toThrow("urlreturn is required");
  });
});
