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
  parsePaykuExpiredInSantiago,
  parsePaymentReturnQuery,
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

describe("SDK entrypoint exports", () => {
  test("exports validation functions", () => {
    expect(typeof PaykuSDK.validateCreateTransactionRequest).toBe("function");
    expect(typeof PaykuSDK.validateChileCreateTransactionRequest).toBe("function");
    expect(typeof PaykuSDK.parsePaymentReturnQuery).toBe("function");
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
    expect(response.gateway_response?.authorization_code).toBe("123456");
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

