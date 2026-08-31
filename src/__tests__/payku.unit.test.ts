import { describe, expect, test } from "bun:test";
import Payku, { PaykuChile, PaykuPeru, PaykuVenezuela } from "../clients/payku";
import { PaykuUnsupportedFeatureError } from "../errors";
import {
  extractPaykuErrorMessage,
  isPaykuFailedResponse,
  isPaykuUnauthorizedResponse,
} from "../index";
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

describe("Payku.forCountry", () => {
  const config = {
    publicToken: "public",
    privateToken: "private",
    environment: "sandbox" as const,
  };

  test("returns Chile client with CLP and Chile-only modules", () => {
    const payku = Payku.forCountry("CL", config);

    expect(payku).toBeInstanceOf(PaykuChile);
    expect(payku.country).toBe("CL");
    expect(payku.currency).toBe("CLP");
    expect(payku.subscriptions).toBeDefined();
    expect(payku.marketplace).toBeDefined();
    expect(payku.wallet.withdraw).toBeDefined();
  });

  test("returns Peru client without Chile-only modules", () => {
    const payku = Payku.forCountry("PE", config);

    expect(payku).toBeInstanceOf(PaykuPeru);
    expect(payku.country).toBe("PE");
    expect(payku.currency).toBe("PEN");
    expect(payku.transactions).toBeDefined();
    expect(payku.wallet).toBeDefined();
    expect("subscriptions" in payku).toBe(false);
  });

  test("returns Venezuela client with On-Site confirm", () => {
    const payku = Payku.forCountry("VE", config);

    expect(payku).toBeInstanceOf(PaykuVenezuela);
    expect(payku.country).toBe("VE");
    expect(payku.currency).toBe("VES");
    expect(payku.transactions.confirmOnSite).toBeDefined();
    expect("subscriptions" in payku).toBe(false);
  });

  test("Peru wallet.withdraw throws UnsupportedFeature", () => {
    const payku = Payku.forCountry("PE", config);

    expect(() => payku.wallet.withdraw).toThrow(PaykuUnsupportedFeatureError);
    expect(() => payku.wallet.withdraw).toThrow(/wallet\.withdraw/);
  });

  test("fromEnvForCountry reads credentials", () => {
    const payku = Payku.fromEnvForCountry("CL", {
      PAYKU_PUBLIC_TOKEN: "public",
      PAYKU_PRIVATE_TOKEN: "private",
      PAYKU_ENVIRONMENT: "production",
    });

    expect(payku).toBeInstanceOf(PaykuChile);
    expect(payku.environment).toBe("production");
  });
});

describe("payku.utils", () => {
  test("buildPaymentRedirectUrl returns url", () => {
    expect(
      buildPaymentRedirectUrl({ url: "https://payku.test/checkout" }),
    ).toBe("https://payku.test/checkout");
  });
});

describe("public error response helpers", () => {
  test("isPaykuFailedResponse narrows failed business payloads", () => {
    const data = {
      status: "failed",
      type: "Not Found",
      message_error: "Transaction not found",
    };

    expect(isPaykuFailedResponse(data)).toBe(true);
    if (isPaykuFailedResponse(data)) {
      expect(extractPaykuErrorMessage(data)).toBe("Transaction not found");
      expect(data.type).toBe("Not Found");
    }

    expect(isPaykuFailedResponse({ status: "success" })).toBe(false);
  });

  test("isPaykuUnauthorizedResponse narrows unauthorized payloads", () => {
    const data = {
      type: "Unauthorized",
      message_error: "Invalid token",
    };

    expect(isPaykuUnauthorizedResponse(data)).toBe(true);
    if (isPaykuUnauthorizedResponse(data)) {
      expect(extractPaykuErrorMessage(data)).toBe("Invalid token");
    }

    expect(isPaykuUnauthorizedResponse({ type: "Not Found" })).toBe(false);
    expect(isPaykuUnauthorizedResponse({ type: "Unauthorized" })).toBe(false);
  });
});
