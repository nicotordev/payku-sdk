import { expect, test } from "bun:test";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / paymentMethods", () => {
  test("lists payment methods for configured account", async () => {
    const payku = createSandboxChileClient();
    const methods = await payku.paymentMethods.list();

    expect(Array.isArray(methods)).toBe(true);
    expect(methods.length).toBeGreaterThan(0);
  });
});
