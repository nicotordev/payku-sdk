import { describe, expect, test } from "bun:test";
import {
  PaykuCreateEventSchema,
  PaykuCreateMallTransactionSchema,
  PaykuMarketplaceAffiliationSchema,
} from "../../zod";

describe("PaykuCreateEventSchema", () => {
  const validEvent = {
    event: "CONCERT-2026",
    name: "Rock Fest",
    date_event: "2026-11-20 21:00:00",
    date_closing_sales: "2026-11-20 18:00:00",
    date_payment: "2026-11-25 00:00:00",
  };

  test("parses valid event request without affiliation", () => {
    const res = PaykuCreateEventSchema.safeParse(validEvent);
    expect(res.success).toBe(true);
  });

  test("parses valid event request with affiliation tuples", () => {
    const res = PaykuCreateEventSchema.safeParse({
      ...validEvent,
      affiliation: [
        ["promoter1@example.com", 15],
        ["promoter2@example.com", 10.5],
      ],
    });
    expect(res.success).toBe(true);
  });

  test("rejects missing required fields", () => {
    for (const field of [
      "event",
      "name",
      "date_event",
      "date_closing_sales",
      "date_payment",
    ] as const) {
      const invalid = { ...validEvent, [field]: "" };
      const res = PaykuCreateEventSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    }
  });

  test("rejects affiliation tuple with invalid percentage", () => {
    const resZero = PaykuCreateEventSchema.safeParse({
      ...validEvent,
      affiliation: [["aff@test.com", 0]],
    });
    expect(resZero.success).toBe(false);

    const resOver100 = PaykuCreateEventSchema.safeParse({
      ...validEvent,
      affiliation: [["aff@test.com", 101]],
    });
    expect(resOver100.success).toBe(false);
  });

  test("rejects affiliation tuple with invalid email", () => {
    const res = PaykuCreateEventSchema.safeParse({
      ...validEvent,
      affiliation: [["not-an-email", 50]],
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) => i.message.includes("valid email")),
      ).toBe(true);
    }
  });

  test("rejects whitespace-only required fields", () => {
    for (const field of [
      "event",
      "name",
      "date_event",
      "date_closing_sales",
      "date_payment",
    ] as const) {
      const invalid = { ...validEvent, [field]: "   " };
      const res = PaykuCreateEventSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toBe(`${field} is required`);
      }
    }
  });
});

describe("PaykuCreateMallTransactionSchema", () => {
  const validMall = {
    email: "buyer@example.com",
    payment: 1,
    merchant: [
      ["tok-submerchant-1", 10000, "Item 1", null, "sub-ord-1"],
      ["tok-submerchant-2", 20000, "Item 2", "evt-99", "sub-ord-2"],
    ] as [string, number, string, string | null, string][],
    order: "mall-ord-100",
    urlreturn: "https://example.com/return",
  };

  test("parses valid mall transaction request", () => {
    const res = PaykuCreateMallTransactionSchema.safeParse(validMall);
    expect(res.success).toBe(true);
  });

  test("rejects missing required top-level fields", () => {
    for (const field of ["email", "urlreturn"] as const) {
      const invalid = { ...validMall, [field]: "" };
      const res = PaykuCreateMallTransactionSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    }
  });

  test("rejects invalid payment code for Mall", () => {
    const res = PaykuCreateMallTransactionSchema.safeParse({
      ...validMall,
      payment: 20, // 20 is PEN SafetyPay, invalid for Mall (CLP)
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toContain("invalid for Mall");
    }
  });

  test("rejects empty merchant array", () => {
    const res = PaykuCreateMallTransactionSchema.safeParse({
      ...validMall,
      merchant: [],
    });
    expect(res.success).toBe(false);
  });

  test("rejects merchant tuple with wrong length", () => {
    const res = PaykuCreateMallTransactionSchema.safeParse({
      ...validMall,
      merchant: [["tok-1", 1000, "Item 1", "sub-1"]], // 4 items instead of 5
    });
    expect(res.success).toBe(false);
  });

  test("rejects non-positive merchant amount", () => {
    const res = PaykuCreateMallTransactionSchema.safeParse({
      ...validMall,
      merchant: [["tok-1", 0, "Item 1", null, "sub-1"]],
    });
    expect(res.success).toBe(false);
  });
});

describe("PaykuMarketplaceAffiliationSchema", () => {
  test("accepts valid affiliation summing to 100", () => {
    const res = PaykuMarketplaceAffiliationSchema.safeParse({
      name: "Split Rule 1",
      percentage: "20",
      affiliation: [
        ["client-1", "50"],
        ["client-2", "30"],
      ],
    });
    expect(res.success).toBe(true);
  });

  test("accepts valid affiliation within floating point tolerance (0.01)", () => {
    const res = PaykuMarketplaceAffiliationSchema.safeParse({
      name: "Split Rule Float",
      percentage: 20,
      affiliation: [["client-1", 79.99]],
    });
    expect(res.success).toBe(true);
  });

  test("rejects percentages that do not sum to 100", () => {
    const res = PaykuMarketplaceAffiliationSchema.safeParse({
      name: "Bad Split",
      percentage: "20",
      affiliation: [["client-1", "30"]],
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.message.includes("must sum to 100"))).toBe(true);
    }
  });

  test("rejects empty or whitespace-only percentage", () => {
    const resEmpty = PaykuMarketplaceAffiliationSchema.safeParse({
      name: "Split",
      percentage: "",
      affiliation: [["client-1", "100"]],
    });
    expect(resEmpty.success).toBe(false);

    const resWhitespace = PaykuMarketplaceAffiliationSchema.safeParse({
      name: "Split",
      percentage: "   ",
      affiliation: [["client-1", "100"]],
    });
    expect(resWhitespace.success).toBe(false);
  });

  test("rejects empty affiliation array", () => {
    const res = PaykuMarketplaceAffiliationSchema.safeParse({
      name: "Split",
      percentage: "100",
      affiliation: [],
    });
    expect(res.success).toBe(false);
  });
});
