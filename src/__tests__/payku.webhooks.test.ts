import { describe, expect, test } from "bun:test";
import Payku, { PaykuWebhooks } from "../clients/payku";
import * as PaykuSDK from "../index";
import type { PaykuGetTransactionResponse } from "../types/payku.transactions";
import { mapNotifyStatusToTransactionStatus } from "../utils/payku.utils";

describe("mapNotifyStatusToTransactionStatus", () => {
  test("maps failed notify status to rejected API status", () => {
    expect(mapNotifyStatusToTransactionStatus("failed")).toBe("rejected");
    expect(mapNotifyStatusToTransactionStatus("success")).toBe("success");
  });
});

describe("PaykuWebhooks", () => {
  test("returns missing_payment_key when payload is incomplete", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () => ({}) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.verifyNotify({
      transaction_id: "1",
      payment_key: "",
      transaction_key: "2",
      verification_key: "3",
      order: "order-1",
      status: "success",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("missing_payment_key");
    }
  });

  test("validates transaction status against Payku API", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          status: "success",
          id: "trx1",
          order: "order-1",
          amount: "1000",
        }) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.verifyNotify({
      transaction_id: "1",
      payment_key: "trx1",
      transaction_key: "2",
      verification_key: "3",
      order: "order-1",
      status: "success",
    });

    expect(result.valid).toBe(true);
  });

  test("maps notify failed to API rejected when expectedStatus omitted", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          status: "rejected",
          id: "trx1",
          order: "order-1",
          amount: "1000",
        }) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.verifyNotify({
      transaction_id: "1",
      payment_key: "trx1",
      transaction_key: "2",
      verification_key: "3",
      order: "order-1",
      status: "failed",
    });

    expect(result.valid).toBe(true);
  });

  test("maps explicit expectedStatus failed to rejected", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          status: "rejected",
          id: "trx1",
          order: "order-1",
        }) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.verifyNotify(
      {
        transaction_id: "1",
        payment_key: "trx1",
        transaction_key: "2",
        verification_key: "3",
        order: "order-1",
        status: "failed",
      },
      { expectedStatus: "failed" },
    );

    expect(result.valid).toBe(true);
  });

  test("detects status mismatch", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          status: "pending",
          id: "trx1",
          order: "order-1",
        }) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.verifyNotify({
      transaction_id: "1",
      payment_key: "trx1",
      transaction_key: "2",
      verification_key: "3",
      order: "order-1",
      status: "success",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("status_mismatch");
    }
  });

  test("accepts matching verification_key from GET payment", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          status: "success",
          id: "trx1",
          order: "order-1",
          amount: "1000",
          payment: { verification_key: "8b3e2202fb086a7de93777ae34d5e18c" },
        }) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.verifyNotify({
      transaction_id: "1",
      payment_key: "trx1",
      transaction_key: "2",
      verification_key: "8b3e2202fb086a7de93777ae34d5e18c",
      order: "order-1",
      status: "success",
    });

    expect(result.valid).toBe(true);
  });

  test("trims verification_key before comparing", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          status: "success",
          id: "trx1",
          order: "order-1",
          amount: "1000",
          payment: { verification_key: "  8b3e2202fb086a7de93777ae34d5e18c  " },
        }) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.verifyNotify({
      transaction_id: "1",
      payment_key: "trx1",
      transaction_key: "2",
      verification_key: "8b3e2202fb086a7de93777ae34d5e18c\n",
      order: "order-1",
      status: "success",
    });

    expect(result.valid).toBe(true);
  });

  test("rejects verification_key of different length", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          status: "success",
          id: "trx1",
          order: "order-1",
          amount: "1000",
          payment: { verification_key: "short" },
        }) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.verifyNotify({
      transaction_id: "1",
      payment_key: "trx1",
      transaction_key: "2",
      verification_key: "a-much-longer-forged-key",
      order: "order-1",
      status: "success",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("verification_key_mismatch");
    }
  });

  test("rejects mismatched verification_key", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          status: "success",
          id: "trx1",
          order: "order-1",
          amount: "1000",
          payment: { verification_key: "api-key" },
        }) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.verifyNotify({
      transaction_id: "1",
      payment_key: "trx1",
      transaction_key: "2",
      verification_key: "forged-key",
      order: "order-1",
      status: "success",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("verification_key_mismatch");
      expect(result.transaction?.id).toBe("trx1");
    }
  });

  test("skips verification_key when GET payment has no key", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          status: "success",
          id: "trx1",
          order: "order-1",
        }) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.verifyNotify({
      transaction_id: "1",
      payment_key: "trx1",
      transaction_key: "2",
      verification_key: "notify-only-key",
      order: "order-1",
      status: "success",
    });

    expect(result.valid).toBe(true);
  });

  test("handleRequest verifies a parsed payload", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          status: "success",
          id: "trx1",
          order: "order-1",
          amount: "1000",
        }) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.handleRequest({
      transaction_id: "1",
      payment_key: "trx1",
      transaction_key: "2",
      verification_key: "3",
      order: "order-1",
      status: "success",
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.transaction.id).toBe("trx1");
    }
  });

  test("handleRequest accepts a Web Request and reuses verifyNotify", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          status: "success",
          id: "trx1",
          order: "order-1",
          amount: "1000",
        }) as PaykuGetTransactionResponse,
    });

    const request = new globalThis.Request(
      "https://tu-sitio.com/api/webhooks/payku",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          transaction_id: "1",
          payment_key: "trx1",
          transaction_key: "2",
          verification_key: "3",
          order: "order-1",
          status: "success",
        }),
      },
    );

    const result = await webhooks.handleRequest(request);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.transaction.id).toBe("trx1");
    }
  });

  test("handleRequest rejects invalid JSON and non-object bodies", async () => {
    const webhooks = new PaykuWebhooks({
      get: async () => ({}) as PaykuGetTransactionResponse,
    });

    const invalidJson = await webhooks.handleRequest(
      new globalThis.Request("https://tu-sitio.com/notify", {
        method: "POST",
        body: "{",
        headers: { "content-type": "application/json" },
      }),
    );
    expect(invalidJson.valid).toBe(false);
    if (!invalidJson.valid) {
      expect(invalidJson.reason).toBe("invalid_json");
    }

    const arrayBody = await webhooks.handleRequest(
      new globalThis.Request("https://tu-sitio.com/notify", {
        method: "POST",
        body: JSON.stringify(["not", "an", "object"]),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(arrayBody.valid).toBe(false);
    if (!arrayBody.valid) {
      expect(arrayBody.reason).toBe("invalid_payload");
    }
  });

  describe("static methods", () => {
    test("PaykuWebhooks.mapStatus maps failed to rejected and preserves other statuses", () => {
      expect(PaykuWebhooks.mapStatus("failed")).toBe("rejected");
      expect(PaykuWebhooks.mapStatus("success")).toBe("success");
      expect(PaykuWebhooks.mapStatus("pending")).toBe("pending");
      expect(PaykuWebhooks.mapStatus("custom_status")).toBe("custom_status");
    });

    test("PaykuWebhooks.parseReturnQuery parses url, query strings, searchParams and records", () => {
      const fromUrl = PaykuWebhooks.parseReturnQuery(
        "https://example.com/return?id=trx-100&status=success",
      );
      expect(fromUrl).toEqual({
        id: "trx-100",
        status: "success",
        messageError: undefined,
        expired: false,
      });

      const fromExpiredUrl = PaykuWebhooks.parseReturnQuery(
        "https://example.com/return?id=trx-200&status=expired",
      );
      expect(fromExpiredUrl.expired).toBe(true);
      expect(fromExpiredUrl.id).toBe("trx-200");

      const fromMessageError = PaykuWebhooks.parseReturnQuery(
        "id=trx-300&message_error=expired",
      );
      expect(fromMessageError.expired).toBe(true);
      expect(fromMessageError.id).toBe("trx-300");

      const searchParams = new URLSearchParams("id=trx-400&status=success");
      const fromSearchParams = PaykuWebhooks.parseReturnQuery(searchParams);
      expect(fromSearchParams.id).toBe("trx-400");
      expect(fromSearchParams.status).toBe("success");
      expect(fromSearchParams.expired).toBe(false);

      const recordQuery = {
        id: "trx-500",
        status: "rejected",
        message_error: "none",
      };
      const fromRecord = PaykuWebhooks.parseReturnQuery(recordQuery);
      expect(fromRecord.id).toBe("trx-500");
      expect(fromRecord.status).toBe("rejected");
      expect(fromRecord.messageError).toBe("none");
      expect(fromRecord.expired).toBe(false);
    });
  });

  describe("instance methods", () => {
    const payku = new Payku("public-token", "private-token");

    test("payku.webhooks.mapStatus maps statuses identically", () => {
      expect(payku.webhooks.mapStatus("failed")).toBe("rejected");
      expect(payku.webhooks.mapStatus("success")).toBe("success");
      expect(payku.webhooks.mapStatus("pending")).toBe("pending");
    });

    test("payku.webhooks.parseReturnQuery parses return payloads identically", () => {
      const parsed = payku.webhooks.parseReturnQuery(
        "https://example.com/return?id=trx-123&status=success",
      );
      expect(parsed).toEqual({
        id: "trx-123",
        status: "success",
        messageError: undefined,
        expired: false,
      });

      const expiredParsed = payku.webhooks.parseReturnQuery({
        id: "trx-999",
        messageError: "expired",
      });
      expect(expiredParsed.id).toBe("trx-999");
      expect(expiredParsed.expired).toBe(true);
    });

    test("methods can be safely destructured without losing context", () => {
      const { mapStatus, parseReturnQuery } = payku.webhooks;

      expect(mapStatus("failed")).toBe("rejected");
      expect(mapStatus("success")).toBe("success");

      const result = parseReturnQuery("?id=trx-destruct&status=success");
      expect(result.id).toBe("trx-destruct");
      expect(result.status).toBe("success");
      expect(result.expired).toBe(false);
    });

    test("country-scoped client webhooks expose hybrid methods", () => {
      const chile = Payku.forCountry("CL", {
        publicToken: "pub-test",
        privateToken: "priv-test",
      });

      expect(chile.webhooks.mapStatus("failed")).toBe("rejected");
      expect(chile.webhooks.mapStatus("success")).toBe("success");

      const parsed = chile.webhooks.parseReturnQuery(
        "?id=cl-trx-1&status=success",
      );
      expect(parsed.id).toBe("cl-trx-1");
      expect(parsed.expired).toBe(false);
    });
  });
});

describe("entrypoint exports", () => {
  test("exports PaykuWebhooks class with static methods", () => {
    expect(typeof PaykuSDK.PaykuWebhooks).toBe("function");
    expect(typeof PaykuSDK.PaykuWebhooks.mapStatus).toBe("function");
    expect(typeof PaykuSDK.PaykuWebhooks.parseReturnQuery).toBe("function");
  });

  test("preserves standalone function exports for serverless/lightweight environments", () => {
    expect(typeof PaykuSDK.parsePaymentReturnQuery).toBe("function");
    expect(typeof PaykuSDK.mapNotifyStatusToTransactionStatus).toBe("function");

    expect(PaykuSDK.mapNotifyStatusToTransactionStatus("failed")).toBe(
      "rejected",
    );
    const parsed = PaykuSDK.parsePaymentReturnQuery(
      "?id=standalone&status=success",
    );
    expect(parsed.id).toBe("standalone");
    expect(parsed.expired).toBe(false);
  });
});
