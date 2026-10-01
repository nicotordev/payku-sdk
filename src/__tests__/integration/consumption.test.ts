import { expect, test } from "bun:test";
import { PaykuError, PaykuSubscriptionsError } from "../../errors";
import {
  SANDBOX_LONG_TIMEOUT_MS,
  createSandboxChileClient,
  describePaykuIntegration,
  generateUniqueEmail,
  generateUniqueId,
  generateUniqueOrder,
  generateUniquePhone,
  isSignRejection,
  noteCapabilityDependent,
  redactSensitiveString,
  withCleanup,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / consumption", () => {
  test(
    "creates a consumption plan, client and subscription on trailing-slash paths",
    async () => {
      const payku = createSandboxChileClient();

      await withCleanup(async (tracker) => {
        let plan;
        try {
          plan = await payku.consumptionSubscriptions.plans.create({
            name: generateUniqueId("p", 20),
            description: "sdk integration",
          });
        } catch (error) {
          if (isSignRejection(error)) {
            throw error;
          }
          if (noteCapabilityDependent("consumption.plans", error)) {
            return;
          }
          throw error;
        }

        expect(plan.status).toBe("success");
        expect(plan.id).toMatch(/^pl/);

        let client;
        try {
          client = await payku.consumptionSubscriptions.clients.create({
            email: generateUniqueEmail("con"),
            name: "SDK Consumption Smoke",
            phone: generateUniquePhone(),
          });
        } catch (error) {
          if (isSignRejection(error)) {
            throw error;
          }
          throw error;
        }

        expect(client.id).toBeTruthy();
        const clientId = client.id!;
        tracker.register(async () => {
          await payku.subscriptions.clients.delete(clientId);
        }, "delete consumption client");

        const subscription =
          await payku.consumptionSubscriptions.subscriptions.create({
            plan: plan.id,
            client: clientId,
          });
        expect(subscription.id).toBeTruthy();
        expect(subscription.status).toBeTruthy();
        expect(subscription.url).toMatch(/^https?:\/\//);

        tracker.register(async () => {
          try {
            await payku.subscriptions.subscriptions.delete(subscription.id);
          } catch (error) {
            // Observed in sandbox: an unactivated consumption subscription
            // rejects DELETE. Do not generalize this to other provider errors.
            if (
              !(error instanceof PaykuSubscriptionsError) ||
              error.statusCode !== 200 ||
              error.type !== "suscription" ||
              error.message !== "suscription status failed"
            ) {
              throw error;
            }
            const current = await payku.subscriptions.subscriptions.get(
              subscription.id,
            );
            if (current.id !== subscription.id || current.status !== "register") {
              throw error;
            }
            console.warn(
              "SANDBOX CLEANUP INCOMPLETE: Payku rejected deletion of an unactivated consumption subscription (GET confirmed register). Manual sandbox cleanup may be required.",
            );
          }
        }, "delete consumption subscription");

        try {
          const charge =
            await payku.consumptionSubscriptions.transactions.create({
              subscription: subscription.id,
              amount: "1000",
              order: generateUniqueOrder("chg"),
              description: "sdk consumption smoke",
            });
          expect(charge.status).toBeTruthy();
        } catch (error) {
          if (isSignRejection(error)) {
            throw error;
          }
          if (!(error instanceof PaykuError)) {
            throw error;
          }
          const text = error.message.toLowerCase();
          const waitingForCard =
            text.includes("not active") ||
            text.includes("no activa") ||
            text.includes("sin tarjeta") ||
            text.includes("no registrada") ||
            text.includes("unregistered");
          if (!waitingForCard) {
            throw error;
          }
          console.warn(
            `CAPABILITY_DEPENDENT consumption.transactions: ${redactSensitiveString(error.message)}`,
          );
        }
      });
    },
    SANDBOX_LONG_TIMEOUT_MS,
  );
});
