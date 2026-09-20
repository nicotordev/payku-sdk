import { describe, expect, test } from "bun:test";
import {
  createChileTransactionSchema,
  createTransactionSchema,
  PaykuChileCreateTransactionSchema,
  PaykuCreateTransactionSchema,
  PaykuExpirationDurationSchema,
  PaykuExpirationInputSchema,
  PaykuListTransactionsParamsSchema,
} from "../../zod";

function formatSantiagoWallClock(d: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

const chileCreateBase = {
  email: "buyer@example.com",
  order: "ord-100",
  subject: "Test Chile",
  amount: 5000,
  urlreturn: "https://example.com/return",
  urlnotify: "https://example.com/notify",
};

describe("PaykuCreateTransactionSchema", () => {
  test("rejects non-positive amounts", () => {
    const resZero = PaykuCreateTransactionSchema.safeParse({
      amount: 0,
      currency: "CLP",
    });
    expect(resZero.success).toBe(false);

    const resNegative = PaykuCreateTransactionSchema.safeParse({
      amount: -100,
      currency: "CLP",
    });
    expect(resNegative.success).toBe(false);
  });

  test("rejects invalid payment codes for currency", () => {
    const res = PaykuCreateTransactionSchema.safeParse({
      amount: 1000,
      currency: "CLP",
      payment: 20,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe(
        "payment 20 is not valid for currency CLP",
      );
    }
  });

  test("accepts payment slugs and transforms them to codes", () => {
    const res = PaykuCreateTransactionSchema.safeParse({
      amount: 1000,
      currency: "CLP",
      payment: "webpay",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.payment).toBe(1);
    }

    const pen = PaykuCreateTransactionSchema.safeParse({
      amount: 1000,
      currency: "PEN",
      payment: "ligopay",
    });
    expect(pen.success).toBe(true);
    if (pen.success) {
      expect(pen.data.payment).toBe(28);
    }
  });

  test("rejects unknown payment slugs", () => {
    const res = PaykuCreateTransactionSchema.safeParse({
      amount: 1000,
      currency: "CLP",
      payment: "paypal",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toContain(
        'payment slug "paypal" is not valid for currency CLP',
      );
    }
  });

  test("rejects CLP Etpay/Fintoc/Floid without payer_rut", () => {
    for (const payment of [4, 19, 26]) {
      const res = PaykuCreateTransactionSchema.safeParse({
        amount: 1000,
        currency: "CLP",
        payment,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toContain(
          "additional_parameters.payer_rut is required",
        );
      }
    }
  });

  test("accepts CLP Etpay with payer_rut", () => {
    const res = PaykuCreateTransactionSchema.safeParse({
      amount: 1000,
      currency: "CLP",
      payment: 4,
      additional_parameters: { payer_rut: "11111111-1" },
    });
    expect(res.success).toBe(true);
  });

  test("rejects unknown VES gateways", () => {
    const res = PaykuCreateTransactionSchema.safeParse({
      amount: 100,
      currency: "VES",
      additional_parameters: { gateway: "INVALID" },
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe("Unknown VES gateway: INVALID");
    }
  });

  test("accepts catalog-only CLP codes by default (Full/Klap)", () => {
    const res = PaykuCreateTransactionSchema.safeParse({
      amount: 1000,
      currency: "CLP",
      payment: 14,
    });
    expect(res.success).toBe(true);
  });

  test("rejects catalog-only CLP codes when clpPaymentCodes is create-docs", () => {
    const validator = createTransactionSchema({
      clpPaymentCodes: "create-docs",
    });
    const res = validator.safeParse({
      amount: 1000,
      currency: "CLP",
      payment: 14,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe(
        "payment 14 is not valid for currency CLP",
      );
    }
  });

  test("rejects expired without urlreturn", () => {
    const res = PaykuCreateTransactionSchema.safeParse({
      amount: 1000,
      currency: "CLP",
      expired: "2099-01-01 12:00:00",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) =>
          i.message.includes("urlreturn is required"),
        ),
      ).toBe(true);
    }
  });

  test("rejects expired with invalid format", () => {
    const res = PaykuCreateTransactionSchema.safeParse({
      amount: 1000,
      currency: "CLP",
      expired: "2099-01-01T12:00:00",
      urlreturn: "https://example.com/return",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) =>
          i.message.includes("expired must use format"),
        ),
      ).toBe(true);
    }
  });

  test("rejects blank or whitespace expired as invalid", () => {
    for (const expired of ["", "   "]) {
      const res = PaykuCreateTransactionSchema.safeParse({
        amount: 1000,
        currency: "CLP",
        expired,
        urlreturn: "https://example.com/return",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(
          res.error.issues.some((i) =>
            i.message.includes("expired must use format"),
          ),
        ).toBe(true);
      }
    }
  });

  test("rejects expired within 5 minutes of now (Santiago)", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const tooSoon = formatSantiagoWallClock(
      new Date(now.getTime() + 2 * 60 * 1000),
    );
    const validator = createTransactionSchema({ now });

    const res = validator.safeParse({
      amount: 1000,
      currency: "CLP",
      expired: tooSoon,
      urlreturn: "https://example.com/return",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) => i.message.includes("more than 5 minutes")),
      ).toBe(true);
    }
  });

  test("accepts expired more than 5 minutes ahead with urlreturn", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const ok = formatSantiagoWallClock(
      new Date(now.getTime() + 10 * 60 * 1000),
    );
    const validator = createTransactionSchema({ now });

    const res = validator.safeParse({
      amount: 1000,
      currency: "CLP",
      expired: ok,
      urlreturn: "https://example.com/return",
    });
    expect(res.success).toBe(true);
  });

  test("accepts expired when urlreturn is supplied via defaults", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const ok = formatSantiagoWallClock(
      new Date(now.getTime() + 10 * 60 * 1000),
    );
    const validator = createTransactionSchema({
      now,
      defaults: { urlreturn: "https://default.example.com/return" },
    });

    const res = validator.safeParse({
      amount: 1000,
      currency: "CLP",
      expired: ok,
    });
    expect(res.success).toBe(true);
  });

  test("rejects expired when default urlreturn is whitespace-only", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const ok = formatSantiagoWallClock(
      new Date(now.getTime() + 10 * 60 * 1000),
    );
    const validator = createTransactionSchema({
      now,
      defaults: { urlreturn: "   " },
    });

    const res = validator.safeParse({
      amount: 1000,
      currency: "CLP",
      expired: ok,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) =>
          i.message.includes("urlreturn is required when expired is set"),
        ),
      ).toBe(true);
    }
  });

  test("accepts relative duration expired ({ minutes: 30 }) with urlreturn", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const validator = createTransactionSchema({ now });
    const res = validator.safeParse({
      amount: 1000,
      currency: "CLP",
      expired: { minutes: 30 },
      urlreturn: "https://example.com/return",
    });
    expect(res.success).toBe(true);
  });

  test("accepts Date instance expired with urlreturn", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const validator = createTransactionSchema({ now });
    const res = validator.safeParse({
      amount: 1000,
      currency: "CLP",
      expired: new Date(now.getTime() + 15 * 60 * 1000),
      urlreturn: "https://example.com/return",
    });
    expect(res.success).toBe(true);
  });

  test("rejects relative duration expired within 5 minutes ({ minutes: 2 })", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const validator = createTransactionSchema({ now });
    const res = validator.safeParse({
      amount: 1000,
      currency: "CLP",
      expired: { minutes: 2 },
      urlreturn: "https://example.com/return",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) =>
          i.message.includes("more than 5 minutes in the future (Santiago)"),
        ),
      ).toBe(true);
    }
  });

  test("accepts direct payerRut for CLP payments requiring payer_rut", () => {
    const res = PaykuCreateTransactionSchema.safeParse({
      amount: 1000,
      currency: "CLP",
      payment: 19,
      payerRut: "18.765.432-1",
    });
    expect(res.success).toBe(true);
  });
});

describe("PaykuExpirationDurationSchema", () => {
  test("accepts valid durations", () => {
    expect(PaykuExpirationDurationSchema.safeParse({ minutes: 30 }).success).toBe(true);
    expect(PaykuExpirationDurationSchema.safeParse({ hours: 2 }).success).toBe(true);
    expect(PaykuExpirationDurationSchema.safeParse({ days: 1 }).success).toBe(true);
    expect(
      PaykuExpirationDurationSchema.safeParse({ days: 1, hours: 2, minutes: 15 }).success,
    ).toBe(true);
  });

  test("rejects non-positive durations", () => {
    expect(PaykuExpirationDurationSchema.safeParse({ minutes: 0 }).success).toBe(false);
    expect(PaykuExpirationDurationSchema.safeParse({ minutes: -5 }).success).toBe(false);
    expect(PaykuExpirationDurationSchema.safeParse({}).success).toBe(false);
  });

  test("PaykuExpirationInputSchema accepts string, Date and duration", () => {
    expect(PaykuExpirationInputSchema.safeParse("2026-12-31 23:59").success).toBe(true);
    expect(PaykuExpirationInputSchema.safeParse(new Date()).success).toBe(true);
    expect(PaykuExpirationInputSchema.safeParse({ minutes: 30 }).success).toBe(true);
    expect(PaykuExpirationInputSchema.safeParse(123).success).toBe(false);
  });
});

describe("PaykuChileCreateTransactionSchema", () => {
  test("rejects missing required fields", () => {
    for (const field of [
      "email",
      "order",
      "subject",
      "urlreturn",
      "urlnotify",
    ] as const) {
      const invalid = { ...chileCreateBase, [field]: "" };
      const res = PaykuChileCreateTransactionSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(
          res.error.issues.some((i) =>
            i.message.includes(`${field} is required`),
          ),
        ).toBe(true);
      }
    }
  });

  test("accepts complete Chile request with optional payment", () => {
    const res = PaykuChileCreateTransactionSchema.safeParse({
      ...chileCreateBase,
      payment: 1,
    });
    expect(res.success).toBe(true);
  });

  test("rejects Chile create when expired is too soon", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const tooSoon = formatSantiagoWallClock(
      new Date(now.getTime() + 60 * 1000),
    );
    const validator = createChileTransactionSchema({ now });

    const res = validator.safeParse({
      ...chileCreateBase,
      expired: tooSoon,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) => i.message.includes("more than 5 minutes")),
      ).toBe(true);
    }
  });

  test("accepts Chile create with relative duration expired ({ minutes: 30 })", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const validator = createChileTransactionSchema({ now });
    const res = validator.safeParse({
      ...chileCreateBase,
      expired: { minutes: 30 },
    });
    expect(res.success).toBe(true);
  });

  test("rejects Chile create with relative duration expired within 5 minutes ({ minutes: 2 })", () => {
    const now = new Date("2024-06-15T15:00:00.000Z");
    const validator = createChileTransactionSchema({ now });
    const res = validator.safeParse({
      ...chileCreateBase,
      expired: { minutes: 2 },
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) => i.message.includes("more than 5 minutes")),
      ).toBe(true);
    }
  });

  test("accepts Chile create with direct payerRut for Fintoc (19)", () => {
    const res = PaykuChileCreateTransactionSchema.safeParse({
      ...chileCreateBase,
      payment: 19,
      payerRut: "18.765.432-1",
    });
    expect(res.success).toBe(true);
  });

  test("rejects whitespace-only required fields", () => {
    for (const field of [
      "email",
      "order",
      "subject",
      "urlreturn",
      "urlnotify",
    ] as const) {
      const res = PaykuChileCreateTransactionSchema.safeParse({
        ...chileCreateBase,
        [field]: "   ",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toBe(`${field} is required`);
      }
    }
  });

  test("accepts Chile request omitting urlreturn and urlnotify when defaults are provided", () => {
    const validator = createChileTransactionSchema({
      defaults: {
        urlreturn: "https://default.example.com/return",
        urlnotify: "https://default.example.com/notify",
      },
    });

    const res = validator.safeParse({
      email: "cliente@example.com",
      order: "orden-defaults",
      subject: "Test defaults",
      amount: 1000,
    });
    expect(res.success).toBe(true);
  });

  test("rejects Chile request when default urlreturn is whitespace-only", () => {
    const validator = createChileTransactionSchema({
      defaults: {
        urlreturn: "   ",
        urlnotify: "https://default.example.com/notify",
      },
    });

    const res = validator.safeParse({
      email: "cliente@example.com",
      order: "orden-defaults",
      subject: "Test defaults",
      amount: 1000,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) => i.message.includes("urlreturn is required")),
      ).toBe(true);
    }
  });

  test("rejects explicit whitespace-only urlreturn even when valid default exists", () => {
    const validator = createChileTransactionSchema({
      defaults: {
        urlreturn: "https://default.example.com/return",
        urlnotify: "https://default.example.com/notify",
      },
    });

    const res = validator.safeParse({
      email: "cliente@example.com",
      order: "orden-defaults",
      subject: "Test defaults",
      amount: 1000,
      urlreturn: "   ",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) => i.message.includes("urlreturn is required")),
      ).toBe(true);
    }
  });

  test("rejects unsupported currencies like USD", () => {
    const res = PaykuCreateTransactionSchema.safeParse({
      amount: 1000,
      currency: "USD",
    });
    expect(res.success).toBe(false);
  });
});

describe("PaykuListTransactionsParamsSchema", () => {
  test("accepts valid per_page and filters", () => {
    const res = PaykuListTransactionsParamsSchema.safeParse({
      per_page: 4000,
      page: 2,
      date_init: "2026-01-01",
      date_end: "2026-01-31",
      success: true,
    });
    expect(res.success).toBe(true);
  });

  test("rejects per_page less than 1", () => {
    const res = PaykuListTransactionsParamsSchema.safeParse({
      per_page: 0,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toContain("between 1 and 4000");
    }
  });

  test("rejects per_page greater than 4000", () => {
    const res = PaykuListTransactionsParamsSchema.safeParse({
      per_page: 4001,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toContain("between 1 and 4000");
    }
  });

  test("rejects non-integer per_page", () => {
    const res = PaykuListTransactionsParamsSchema.safeParse({
      per_page: 10.5,
    });
    expect(res.success).toBe(false);
  });
});
