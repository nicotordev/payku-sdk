import { describe, expect, test } from "bun:test";
import PaykuWebhooks from "../../clients/payku.webhooks";
import type { PaykuGetTransactionResponse } from "../../types/payku.transactions";
import { parsePaymentReturnQuery } from "../../utils/payku.utils";
import {
  PaykuPaymentReturnQuerySchema,
  PaykuTransactionNotifySchema,
  toPaykuNotifyPayload,
} from "../../zod";

describe("PaykuTransactionNotifySchema", () => {
  const validPayload = {
    transaction_id: "9916587765599311",
    payment_key: "trx32cb779c0a777fc68",
    transaction_key: "9916581777599311",
    verification_key: "8b3e2202fb086a7de93777ae34d5e18c",
    order: "199",
    status: "success",
  };

  test("parses valid standard urlnotify payload", () => {
    const result = PaykuTransactionNotifySchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.transaction_id).toBe("9916587765599311");
      expect(result.data.id).toBe("9916587765599311");
      expect(result.data.payment_key).toBe("trx32cb779c0a777fc68");
      expect(result.data.order).toBe("199");
      expect(result.data.status).toBe("success");
      expect(result.data.verification_key).toBe(
        "8b3e2202fb086a7de93777ae34d5e18c",
      );
    }
  });

  test("normalizes id and transaction_id seamlessly", () => {
    const payloadWithId = {
      id: "trx-id-555",
      payment_key: "pk-1",
      order: "ord-1",
      status: "success",
    };
    const parsed = PaykuTransactionNotifySchema.parse(payloadWithId);
    expect(parsed.id).toBe("trx-id-555");
    expect(parsed.transaction_id).toBe("trx-id-555");
  });

  test("normalizes token, verification_token and verification_key", () => {
    const payloadWithToken = {
      transaction_id: "tx-1",
      payment_key: "pk-1",
      token: "tok-abc",
      order: "ord-1",
      status: "failed",
    };
    const parsed = PaykuTransactionNotifySchema.parse(payloadWithToken);
    expect(parsed.token).toBe("tok-abc");
    expect(parsed.verification_key).toBe("tok-abc");
    expect(parsed.verification_token).toBe("tok-abc");
  });

  test("coerces numeric order to string", () => {
    const payloadWithNumericOrder = {
      ...validPayload,
      order: 12345,
    };
    const parsed = PaykuTransactionNotifySchema.parse(payloadWithNumericOrder);
    expect(parsed.order).toBe("12345");
  });

  test("accepts optional amount, currency and payment", () => {
    const payloadWithOptionals = {
      ...validPayload,
      amount: 15000,
      currency: "CLP",
      payment: 1,
    };
    const parsed = PaykuTransactionNotifySchema.parse(payloadWithOptionals);
    expect(parsed.amount).toBe(15000);
    expect(parsed.currency).toBe("CLP");
    expect(parsed.payment).toBe(1);
  });

  test("passes through additional gateway fields without error", () => {
    const payloadWithExtra = {
      ...validPayload,
      custom_merchant_data: "extra_info",
      bank_authorization_code: "1234",
    };
    const parsed = PaykuTransactionNotifySchema.parse(payloadWithExtra);
    expect((parsed as Record<string, unknown>).custom_merchant_data).toBe(
      "extra_info",
    );
    expect((parsed as Record<string, unknown>).bank_authorization_code).toBe(
      "1234",
    );
  });

  test("rejects missing payment_key", () => {
    const invalid = { ...validPayload, payment_key: "" };
    const result = PaykuTransactionNotifySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  test("rejects missing order", () => {
    const invalid = { ...validPayload, order: "" };
    const result = PaykuTransactionNotifySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  test("rejects missing status", () => {
    const invalid = { ...validPayload, status: "" };
    const result = PaykuTransactionNotifySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  test("toPaykuNotifyPayload bridges with PaykuWebhooks.verifyNotify", async () => {
    const parsed = PaykuTransactionNotifySchema.parse(validPayload);
    const notifyPayload = toPaykuNotifyPayload(parsed);

    const webhooks = new PaykuWebhooks({
      get: async () =>
        ({
          id: parsed.payment_key,
          status: "success",
          order: parsed.order,
          amount: 1000,
        }) as PaykuGetTransactionResponse,
    });

    const result = await webhooks.verifyNotify(notifyPayload);
    expect(result.valid).toBe(true);
  });
});

describe("PaykuPaymentReturnQuerySchema", () => {
  test("parses full URL string with expired message_error", () => {
    const url =
      "https://comercio.cl/retorno?id=trx-123&status=failed&message_error=expired";
    const result = PaykuPaymentReturnQuerySchema.parse(url);
    const utilsResult = parsePaymentReturnQuery(url);

    expect(result.id).toBe("trx-123");
    expect(result.status).toBe("failed");
    expect(result.messageError).toBe("expired");
    expect(result.expired).toBe(true);
    expect(result).toEqual(utilsResult);
  });

  test("parses partial query string", () => {
    const query = "?id=trx-456&status=success";
    const result = PaykuPaymentReturnQuerySchema.parse(query);
    const utilsResult = parsePaymentReturnQuery(query);

    expect(result.id).toBe("trx-456");
    expect(result.status).toBe("success");
    expect(result.messageError).toBeUndefined();
    expect(result.expired).toBe(false);
    expect(result).toEqual(utilsResult);
  });

  test("parses URLSearchParams instance", () => {
    const params = new URLSearchParams(
      "id=trx-789&status=pending&messageError=SomeError",
    );
    const result = PaykuPaymentReturnQuerySchema.parse(params);
    const utilsResult = parsePaymentReturnQuery(params);

    expect(result.id).toBe("trx-789");
    expect(result.status).toBe("pending");
    expect(result.messageError).toBe("SomeError");
    expect(result.expired).toBe(false);
    expect(result).toEqual(utilsResult);
  });

  test("parses object record with single values", () => {
    const reqQuery = {
      id: "trx-abc",
      status: "rejected",
      message_error: "expired",
    };
    const result = PaykuPaymentReturnQuerySchema.parse(reqQuery);
    const utilsResult = parsePaymentReturnQuery(reqQuery);

    expect(result.id).toBe("trx-abc");
    expect(result.status).toBe("rejected");
    expect(result.messageError).toBe("expired");
    expect(result.expired).toBe(true);
    expect(result).toEqual(utilsResult);
  });

  test("parses object record with array values (Next.js / Express)", () => {
    const reqQuery = { id: ["trx-array"], status: ["success"] };
    const result = PaykuPaymentReturnQuerySchema.parse(reqQuery);
    const utilsResult = parsePaymentReturnQuery(reqQuery);

    expect(result.id).toBe("trx-array");
    expect(result.status).toBe("success");
    expect(result.expired).toBe(false);
    expect(result).toEqual(utilsResult);
  });

  test("strips URL hash fragment from param values", () => {
    const url = "https://comercio.cl/retorno?id=trx-hash#section";
    const result = PaykuPaymentReturnQuerySchema.parse(url);
    const utilsResult = parsePaymentReturnQuery(url);

    expect(result.id).toBe("trx-hash");
    expect(result).toEqual(utilsResult);
  });

  test("detects expired flag when status is 'expired'", () => {
    const query = { id: "trx-1", status: "expired" };
    const result = PaykuPaymentReturnQuerySchema.parse(query);
    expect(result.expired).toBe(true);
  });

  test("avoids false positives like message_error=not_expired", () => {
    const query = "id=trx-99&message_error=not_expired";
    const result = PaykuPaymentReturnQuerySchema.parse(query);
    const utilsResult = parsePaymentReturnQuery(query);

    expect(result.expired).toBe(false);
    expect(result).toEqual(utilsResult);
  });

  test("safeParse fails gracefully on non-object / non-string input", () => {
    const result = PaykuPaymentReturnQuerySchema.safeParse(12345);
    expect(result.success).toBe(false);
  });
});
