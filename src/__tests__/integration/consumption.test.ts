import {
  createSandboxChileClient,
  describePaykuIntegration,
  generateUniqueId,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / consumption", () => {
  test("plans.create signs /api/suplan/ and returns plan id", async () => {
    const payku = createSandboxChileClient();
    const name = generateUniqueId("p", 20);

    const response = await payku.consumptionSubscriptions.plans.create({
      name,
      description: "sdk integration",
    });

    expect(response.status).toBe("success");
    expect(response.id).toMatch(/^pl/);
  });
});
