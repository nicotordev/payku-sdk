import { expect, test } from "bun:test";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / paymentMethods", () => {
  test("lists CLP payment methods and reports Webpay availability", async () => {
    const payku = createSandboxChileClient();
    const methods = await payku.paymentMethods.list({ currency: "clp" });

    expect(Array.isArray(methods)).toBe(true);
    expect(methods.length).toBeGreaterThan(0);

    for (const method of methods) {
      expect(method.payment).toEqual(expect.any(Number));
      expect(method.name).toEqual(expect.any(String));
      expect(method.name.length).toBeGreaterThan(0);
      expect(method.currency).toEqual(expect.any(String));
    }

    const webpay = methods.find(
      (method) =>
        method.payment === 1 || method.name.toLowerCase().includes("webpay"),
    );

    if (!webpay) {
      console.warn(
        "CAPABILITY_DEPENDENT paymentMethods.webpay: Webpay no está habilitado para la cuenta sandbox",
      );
      return;
    }

    expect(webpay.payment).toBe(1);
  });
});
