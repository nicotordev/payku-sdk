import { describe, expect, test } from "bun:test";
import PaykuWebhooks from "../clients/payku.webhooks";
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
});
