import { describe, expect, test } from "bun:test";
import { buildSign } from "./sign";

describe("buildSign", () => {
  test("matches Payku documentation example", () => {
    const sign = buildSign(
      "/api/suclient",
      {
        email: "johndoe@example.com",
        name: "John Doe",
        phone: "923122312",
        address: "Moneda 101",
        country: "Chile",
        region: "Metropolitana",
        city: "Santiago",
        postal_code: "850000",
        additional_parameters: {
          parameter_1: "example",
          parameter_2: "example 2",
        },
      },
      "fe551abcef62fcf002dc598922e68f0a",
    );

    expect(sign).toBe(
      "c9c86202b1246f6ebeb080d08b3b99a22d36d0e8cffb7fd4e65af0fea4dd12bb",
    );
  });

  test("signs GET paths without params", () => {
    const sign = buildSign("/api/wallet", {}, "private-token");

    expect(sign).toMatch(/^[a-f0-9]{64}$/);
  });
});
