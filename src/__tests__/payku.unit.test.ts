import { describe, expect, test } from "bun:test";
import Payku, { PaykuChile, PaykuPeru, PaykuVenezuela } from "../clients/payku";
import { PaykuError, PaykuUnsupportedFeatureError, isPaykuError } from "../errors";
import { buildSign } from "../http/sign";
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
    expect(payku.defaults).toBeUndefined();
  });

  test("fromEnv and fromEnvForCountry reject unsupported environments", () => {
    for (const environment of ["staging", ""]) {
      const env = {
        PAYKU_PUBLIC_TOKEN: "public",
        PAYKU_PRIVATE_TOKEN: "private",
        PAYKU_ENVIRONMENT: environment,
      };

      expect(() => Payku.fromEnv(env)).toThrow(
        `invalid PAYKU_ENVIRONMENT "${environment}"`,
      );
      expect(() => Payku.fromEnvForCountry("CL", env)).toThrow(
        `invalid PAYKU_ENVIRONMENT "${environment}"`,
      );
    }
  });

  test("fromEnv reads defaults from PAYKU_DEFAULT_URLRETURN and PAYKU_DEFAULT_URLNOTIFY", () => {
    const payku = Payku.fromEnv({
      PAYKU_PUBLIC_TOKEN: "public",
      PAYKU_PRIVATE_TOKEN: "private",
      PAYKU_DEFAULT_URLRETURN: "https://example.com/return",
      PAYKU_DEFAULT_URLNOTIFY: "https://example.com/notify",
    });

    expect(payku.defaults).toEqual({
      urlreturn: "https://example.com/return",
      urlnotify: "https://example.com/notify",
    });
  });

  test("fromConfig preserves defaults", () => {
    const payku = Payku.fromConfig({
      publicToken: "public",
      privateToken: "private",
      defaults: {
        urlreturn: "https://example.com/ret",
      },
    });

    expect(payku.defaults).toEqual({
      urlreturn: "https://example.com/ret",
    });
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

  test("fromEnvForCountry reads credentials and defaults", () => {
    const payku = Payku.fromEnvForCountry("CL", {
      PAYKU_PUBLIC_TOKEN: "public",
      PAYKU_PRIVATE_TOKEN: "private",
      PAYKU_ENVIRONMENT: "production",
      PAYKU_DEFAULT_URLRETURN: "https://example.com/return",
      PAYKU_DEFAULT_URLNOTIFY: "https://example.com/notify",
    });

    expect(payku).toBeInstanceOf(PaykuChile);
    expect(payku.environment).toBe("production");
    expect(payku.defaults).toEqual({
      urlreturn: "https://example.com/return",
      urlnotify: "https://example.com/notify",
    });
  });

  test("isSupported reads the country feature matrix", () => {
    expect(Payku.forCountry("CL", config).isSupported("mall")).toBe(true);
    expect(Payku.forCountry("PE", config).isSupported("mall")).toBe(false);
    expect(Payku.forCountry("VE", config).isSupported("onSite")).toBe(true);
    expect(Payku.forCountry("PE", config).isSupported("onSite")).toBe(false);

    const { isSupported } = Payku.forCountry("CL", config);
    expect(isSupported("subscriptions")).toBe(true);
  });

  test("sign uses the configured private token", () => {
    const privateToken = "fe551abcef62fcf002dc598922e68f0a";
    const params = {
      email: "johndoe@example.com",
      name: "John Doe",
    };
    const expected = buildSign("/api/suclient", params, privateToken);
    const payku = new Payku("public", privateToken);
    const chile = Payku.forCountry("CL", {
      publicToken: "public",
      privateToken,
    });

    expect(payku.sign("/api/suclient", params)).toBe(expected);
    expect(chile.sign("/api/suclient", params)).toBe(expected);
    expect(Payku.sign("/api/suclient", params, privateToken)).toBe(expected);
    expect(payku.sign("/api/wallet")).toBe(
      buildSign("/api/wallet", {}, privateToken),
    );

    const { sign } = payku;
    expect(sign("/api/suclient", params)).toBe(expected);
  });

  test("Payku.isError aliases isPaykuError", () => {
    const error = new PaykuError("boom");

    expect(Payku.isError(error)).toBe(true);
    expect(Payku.isError(error)).toBe(isPaykuError(error));
    expect(Payku.isError(new Error("boom"))).toBe(false);
    expect(Payku.isError("boom")).toBe(false);
  });

  test("forCountry preserves defaults", () => {
    const payku = Payku.forCountry("CL", {
      ...config,
      defaults: {
        urlreturn: "https://example.com/cl-return",
      },
    });

    expect(payku.defaults).toEqual({
      urlreturn: "https://example.com/cl-return",
    });
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
