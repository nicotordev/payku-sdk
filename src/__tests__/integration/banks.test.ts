import { expect, test } from "bun:test";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / banks", () => {
  test("lists CLP banks", async () => {
    const payku = createSandboxChileClient();
    const banks = await payku.banks.list({ currency: "clp" });

    expect(Array.isArray(banks)).toBe(true);
    expect(banks.length).toBeGreaterThan(0);
    expect(banks[0]).toMatchObject({
      code: expect.any(String),
      name: expect.any(String),
    });
  });
});
