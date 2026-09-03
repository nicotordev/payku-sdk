import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import Payku, { PaykuChile } from "../clients/payku";
import PaykuTransactions from "../clients/payku.transactions";
import { PaykuChileTransactions } from "../clients/payku.transactions.scoped";
import { PaykuError } from "../errors";
import { HttpClient } from "../http/client";
import {
  parsePaykuExpiredInSantiago,
  validateChileCreateTransactionRequest,
  validateCreateTransactionRequest,
} from "../utils/payku.utils";

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
});

describe("parsePaykuExpiredInSantiago", () => {
  test("round-trips a Santiago wall-clock instant", () => {
    const expired = "2023-10-19 13:05:10";
    const parsed = parsePaykuExpiredInSantiago(expired);
    expect(formatSantiagoWallClock(parsed)).toBe(expired);
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
