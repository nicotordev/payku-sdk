import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuConciliation from "../clients/payku.conciliation";
import { PaykuConciliationError, PaykuError } from "../errors";
import { HttpClient } from "../http/client";
import { validateConciliationRequest } from "../utils/payku.utils";
import conciliationListFixture from "./fixtures/chile/conciliation/list-200.json";

describe("PaykuConciliation", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let conciliation: PaykuConciliation;

  beforeEach(() => {
    apiAxios = axios.create({ baseURL: "https://des.payku.cl/api" });
    mock = new MockAdapter(apiAxios);
    const http = new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl: "https://des.payku.cl",
      publicToken: "public-token",
      privateToken: "private-token",
      axiosInstance: apiAxios,
      rootAxiosInstance: apiAxios,
    });
    conciliation = new PaykuConciliation(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("list posts date range and maps conciliation[] fixture correctly", async () => {
    mock.onPost("/conciliation").reply((config) => {
      expect(JSON.parse(String(config.data))).toEqual({
        date_init: "2023-10-20",
        date_end: "2023-10-21",
      });
      expect(config.headers?.Sign).toBeUndefined();
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      return [200, conciliationListFixture];
    });

    const response = await conciliation.list({
      date_init: "2023-10-20",
      date_end: "2023-10-21",
    });

    expect(response.conciliation).toHaveLength(1);
    expect(response.conciliation[0]?.id).toBe("1");
    expect(response.conciliation[0]?.status).toBe("paid_out");
    expect(response.conciliation[0]?.transaction?.[0]?.transaction_id).toBe("trx_1001");
    expect(response.conciliation[0]?.transaction?.[0]?.amount).toBe(10000);
    expect(response.conciliation[0]?.transaction?.[0]?.amount_deposit).toBe(9500);
  });

  test("create is a backwards-compatible alias of list", async () => {
    mock.onPost("/conciliation").reply((config) => {
      expect(config.headers?.Sign).toBeUndefined();
      return [200, conciliationListFixture];
    });

    const response = await conciliation.create({
      date_init: "2023-10-20",
      date_end: "2023-10-21",
    });

    expect(response.conciliation).toHaveLength(1);
    expect(response.conciliation[0]?.status).toBe("paid_out");
  });

  test("throws PaykuConciliationError on 401 unauthorized", async () => {
    mock.onPost("/conciliation").reply(401, {
      status: "error",
      message: "Token inválido o expirado",
    });

    await expect(
      conciliation.list({
        date_init: "2023-10-20",
        date_end: "2023-10-21",
      }),
    ).rejects.toThrow(PaykuConciliationError);
  });

  test("throws PaykuConciliationError on 500 server error", async () => {
    mock.onPost("/conciliation").reply(500, {
      message: "Internal server error",
    });

    await expect(
      conciliation.list({
        date_init: "2023-10-20",
        date_end: "2023-10-21",
      }),
    ).rejects.toThrow(PaykuConciliationError);
  });

  describe("Validation (validateConciliationRequest)", () => {
    const fixedNow = new Date("2024-06-15T12:00:00Z");

    test("throws PaykuError if date_init or date_end is empty or missing", () => {
      expect(() =>
        validateConciliationRequest(
          { date_init: "", date_end: "2024-06-10" },
          { now: fixedNow },
        ),
      ).toThrow(PaykuError);

      expect(() =>
        validateConciliationRequest(
          { date_init: "2024-06-10", date_end: "" },
          { now: fixedNow },
        ),
      ).toThrow(PaykuError);
    });

    test("throws PaykuError on invalid date format", () => {
      expect(() =>
        validateConciliationRequest(
          { date_init: "2024/06/01", date_end: "2024/06/10" },
          { now: fixedNow },
        ),
      ).toThrow("must use format YYYY-MM-DD");

      expect(() =>
        validateConciliationRequest(
          { date_init: "10-06-2024", date_end: "12-06-2024" },
          { now: fixedNow },
        ),
      ).toThrow("must use format YYYY-MM-DD");
    });

    test("throws PaykuError on nonexistent calendar date", () => {
      expect(() =>
        validateConciliationRequest(
          { date_init: "2024-02-30", date_end: "2024-03-05" },
          { now: fixedNow },
        ),
      ).toThrow("is not a valid date");
    });

    test("throws PaykuError if dates are in the future", () => {
      expect(() =>
        validateConciliationRequest(
          { date_init: "2024-06-10", date_end: "2024-06-20" },
          { now: fixedNow },
        ),
      ).toThrow("cannot be in the future");
    });

    test("throws PaykuError if date_init > date_end", () => {
      expect(() =>
        validateConciliationRequest(
          { date_init: "2024-06-10", date_end: "2024-06-05" },
          { now: fixedNow },
        ),
      ).toThrow("must be less than or equal to");
    });

    test("throws PaykuError if date range exceeds 30 days", () => {
      expect(() =>
        validateConciliationRequest(
          { date_init: "2024-05-01", date_end: "2024-06-02" }, // 32 days
          { now: fixedNow },
        ),
      ).toThrow("must not exceed 30 days");
    });

    test("allows valid date range within 30 days", () => {
      expect(() =>
        validateConciliationRequest(
          { date_init: "2024-05-16", date_end: "2024-06-15" }, // exactly 30 days
          { now: fixedNow },
        ),
      ).not.toThrow();

      expect(() =>
        validateConciliationRequest(
          { date_init: "2024-06-10", date_end: "2024-06-10" }, // single day
          { now: fixedNow },
        ),
      ).not.toThrow();
    });

    test("conciliation.list enforces validation before network call", async () => {
      // Invalid date should reject before making an HTTP request
      await expect(
        conciliation.list({ date_init: "invalid-date", date_end: "2024-01-01" }),
      ).rejects.toThrow(PaykuError);
    });
  });
});
