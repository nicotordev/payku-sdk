import { describe, expect, test } from "bun:test";
import Payku from "../clients/payku";
import { buildPaymentRedirectUrl } from "../utils/payku.utils";

describe("Payku client", () => {
  test("requires tokens", () => {
    expect(() => new Payku("", "private")).toThrow(
      "publicToken and privateToken",
    );
    expect(() => new Payku("public", "")).toThrow(
      "publicToken and privateToken",
    );
  });

  test("fromEnv reads Bun environment", () => {
    const payku = Payku.fromEnv({
      PAYKU_PUBLIC_TOKEN: "public",
      PAYKU_PRIVATE_TOKEN: "private",
      PAYKU_ENVIRONMENT: "production",
    });

    expect(payku.environment).toBe("production");
    expect(payku.baseUrl).toBe("https://app.payku.cl/api");
    expect(payku.rootUrl).toBe("https://app.payku.cl");
  });

  test("exposes all resource namespaces", () => {
    const payku = new Payku("public", "private", "sandbox");

    expect(payku.transactions).toBeDefined();
    expect(payku.wallet).toBeDefined();
    expect(payku.banks).toBeDefined();
    expect(payku.paymentMethods).toBeDefined();
    expect(payku.webhooks).toBeDefined();
    expect(payku.subscriptions).toBeDefined();
    expect(payku.marketplace).toBeDefined();
    expect(payku.mall).toBeDefined();
    expect(payku.events).toBeDefined();
    expect(payku.escrow).toBeDefined();
    expect(payku.nullification).toBeDefined();
    expect(payku.conciliation).toBeDefined();
  });
});

describe("payku.utils", () => {
  test("buildPaymentRedirectUrl returns url", () => {
    expect(
      buildPaymentRedirectUrl({ url: "https://payku.test/checkout" }),
    ).toBe("https://payku.test/checkout");
  });
});
