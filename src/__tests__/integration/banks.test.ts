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

    for (const bank of banks) {
      expect(bank.code).toEqual(expect.any(String));
      expect(bank.code.length).toBeGreaterThan(0);
      expect(bank.name).toEqual(expect.any(String));
      expect(bank.name.length).toBeGreaterThan(0);
      expect(bank.currency).toEqual(expect.any(String));
      expect(String(bank.currency).toLowerCase()).toBe("clp");
    }
  });
});
