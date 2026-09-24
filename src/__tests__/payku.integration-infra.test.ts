import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  IntegrationCleanupTracker,
  SANDBOX_TEST_RUT,
  SANDBOX_TIMEOUT_MS,
  assertSandboxEnvironment,
  createSandboxChileClient,
  createSandboxClient,
  createSandboxRedactingLogger,
  generateUniqueEmail,
  generateUniqueId,
  generateUniqueOrder,
  generateUniquePhone,
  redactSensitiveData,
  redactSensitiveString,
  withCleanup,
  withRetry,
} from "../test-utils/paykuIntegration";

describe("Payku Integration Test Infrastructure", () => {
  describe("assertSandboxEnvironment", () => {
    test("accepts sandbox environment", () => {
      expect(() => assertSandboxEnvironment("sandbox")).not.toThrow();
      expect(() => assertSandboxEnvironment("SANDBOX")).not.toThrow();
    });

    test("throws security error on production, non-sandbox or missing environment", () => {
      expect(() => assertSandboxEnvironment(undefined)).toThrow(/SECURITY ERROR/i);
      expect(() => assertSandboxEnvironment("")).toThrow(/SECURITY ERROR/i);
      expect(() => assertSandboxEnvironment("production")).toThrow(
        /SECURITY ERROR/i,
      );
      expect(() => assertSandboxEnvironment("staging")).toThrow(
        /SECURITY ERROR/i,
      );
      expect(() => assertSandboxEnvironment("live")).toThrow(/SECURITY ERROR/i);
    });
  });

  describe("data generators", () => {
    test("generateUniqueId generates unique, prefixed strings", () => {
      const id1 = generateUniqueId("order");
      const id2 = generateUniqueId("order");
      expect(id1).toMatch(/^order_/);
      expect(id2).toMatch(/^order_/);
      expect(id1).not.toBe(id2);
    });

    test("generateUniqueOrder generates collision-free orders across multiple iterations", () => {
      const orders = new Set<string>();
      for (let i = 0; i < 50; i++) {
        orders.add(generateUniqueOrder());
      }
      expect(orders.size).toBe(50);
    });

    test("generateUniqueEmail generates unique valid email addresses", () => {
      const email1 = generateUniqueEmail("user");
      const email2 = generateUniqueEmail("user");
      expect(email1).toMatch(/^user-[a-z0-9_-]+@example\.com$/);
      expect(email1).not.toBe(email2);
    });

    test("generateUniquePhone generates 9-digit Chilean mobile phone number", () => {
      const phone = generateUniquePhone();
      expect(phone).toMatch(/^9\d{8}$/);
      expect(phone.length).toBe(9);
    });

    test("exposes valid sandbox constants", () => {
      expect(SANDBOX_TEST_RUT).toBe("11111111-1");
      expect(SANDBOX_TIMEOUT_MS).toBeGreaterThanOrEqual(15_000);
    });
  });

  describe("IntegrationCleanupTracker & withCleanup", () => {
    test("runs cleanup tasks in LIFO order", async () => {
      const tracker = new IntegrationCleanupTracker();
      const executionOrder: number[] = [];

      tracker.register(async () => {
        executionOrder.push(1);
      });
      tracker.register(async () => {
        executionOrder.push(2);
      });
      tracker.register(async () => {
        executionOrder.push(3);
      });

      expect(tracker.pendingCount).toBe(3);
      const result = await tracker.runAll();

      expect(executionOrder).toEqual([3, 2, 1]);
      expect(result.executed).toBe(3);
      expect(result.failed).toBe(0);
      expect(tracker.pendingCount).toBe(0);
    });

    test("continues executing cleanups even if one throws", async () => {
      const tracker = new IntegrationCleanupTracker();
      const executed: string[] = [];

      tracker.register(async () => {
        executed.push("first");
      });
      tracker.register(async () => {
        throw new Error("Cleanup failed");
      });
      tracker.register(async () => {
        executed.push("third");
      });

      const result = await tracker.runAll();
      expect(executed).toEqual(["third", "first"]);
      expect(result.executed).toBe(2);
      expect(result.failed).toBe(1);
    });

    test("withCleanup runs cleanups on success and failure", async () => {
      let cleanedUp = false;

      await withCleanup(async (tracker) => {
        tracker.register(async () => {
          cleanedUp = true;
        });
      });
      expect(cleanedUp).toBe(true);

      let cleanedUpOnError = false;
      await expect(
        withCleanup(async (tracker) => {
          tracker.register(async () => {
            cleanedUpOnError = true;
          });
          throw new Error("Test failed midway");
        }),
      ).rejects.toThrow("Test failed midway");

      expect(cleanedUpOnError).toBe(true);
    });

    test("withCleanup throws AggregateError when a cleanup task fails on successful action", async () => {
      await expect(
        withCleanup(async (tracker) => {
          tracker.register(async () => {
            throw new Error("Cleanup failed");
          });
          return "ok";
        }),
      ).rejects.toThrow("Fallaron 1 tareas de cleanup en Sandbox");
    });
  });

  describe("withRetry", () => {
    test("returns result on first attempt if no failure", async () => {
      let attempts = 0;
      const result = await withRetry(async () => {
        attempts++;
        return "success";
      });
      expect(result).toBe("success");
      expect(attempts).toBe(1);
    });

    test("retries on failure until maxRetries", async () => {
      let attempts = 0;
      const result = await withRetry(
        async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error("Transient error");
          }
          return "recovered";
        },
        { maxRetries: 2, delayMs: 10 },
      );

      expect(result).toBe("recovered");
      expect(attempts).toBe(2);
    });
  });

  describe("redactSensitiveData and redactSensitiveString", () => {
    test("redacts Bearer tokens and Sign headers in strings", () => {
      const input = "Request with Bearer mysecrettoken123 and Sign: a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596 in header";
      const redacted = redactSensitiveString(input);
      expect(redacted).not.toContain("mysecrettoken123");
      expect(redacted).toContain("Bearer [REDACTED]");
      expect(redacted).toContain("Sign: [REDACTED_SIGN]");
    });

    test("redacts sensitive keys in objects recursively", () => {
      const payload = {
        name: "Test",
        publicToken: "pk_live_123",
        privateToken: "sk_live_456",
        data: {
          verification_key: "vk_789",
          normalField: 42,
          nested: {
            token: "tok_abc",
          },
        },
      };

      const redacted = redactSensitiveData(payload) as typeof payload;
      expect(redacted.name).toBe("Test");
      expect(redacted.publicToken).toBe("[REDACTED]");
      expect(redacted.privateToken).toBe("[REDACTED]");
      expect(redacted.data.verification_key).toBe("[REDACTED]");
      expect(redacted.data.normalField).toBe(42);
      expect(redacted.data.nested.token).toBe("[REDACTED]");
    });

    test("createSandboxRedactingLogger redacts error messages before passing to logger", () => {
      let loggedMessage = "";
      const customLogger = {
        error(event: { message: string }) {
          loggedMessage = event.message;
        },
      };

      const safeLogger = createSandboxRedactingLogger(customLogger);
      safeLogger.error({
        operation: "testOp",
        statusCode: 500,
        type: "ApiError",
        message: "Failed with Bearer secrettoken456",
      });

      expect(loggedMessage).toContain("Bearer [REDACTED]");
      expect(loggedMessage).not.toContain("secrettoken456");
    });
  });

  describe("client factories", () => {
    let originalEnvironment: string | undefined;

    beforeEach(() => {
      originalEnvironment = process.env.PAYKU_ENVIRONMENT;
      process.env.PAYKU_ENVIRONMENT = "sandbox";
    });

    afterEach(() => {
      if (originalEnvironment === undefined) {
        delete process.env.PAYKU_ENVIRONMENT;
      } else {
        process.env.PAYKU_ENVIRONMENT = originalEnvironment;
      }
    });

    test("createSandboxChileClient configures sandbox environment and redacts messages sent to the base logger", () => {
      let loggedMessage = "";
      const client = createSandboxChileClient({
        logger: {
          error(event) {
            loggedMessage = event.message;
          },
        },
      });
      expect(client.country).toBe("CL");
      expect(client.environment).toBe("sandbox");
      expect(client.options.logger).toBeDefined();
      const signature = "ab".repeat(32);
      client.options.logger?.error({
        operation: "testOp",
        statusCode: 500,
        type: "ApiError",
        message: `Failed with Bearer sandbox-test-token and Sign: ${signature}`,
      });
      expect(loggedMessage).toBe(
        "Failed with Bearer [REDACTED] and Sign: [REDACTED_SIGN]",
      );
    });

    test("createSandboxClient configures sandbox environment and redacts messages sent to the base logger", () => {
      let loggedMessage = "";
      const client = createSandboxClient({
        logger: {
          error(event) {
            loggedMessage = event.message;
          },
        },
      });
      expect(client.environment).toBe("sandbox");
      expect(client.options.logger).toBeDefined();
      const signature = "ab".repeat(32);
      client.options.logger?.error({
        operation: "testOp",
        statusCode: 500,
        type: "ApiError",
        message: `Failed with Bearer sandbox-test-token and Sign: ${signature}`,
      });
      expect(loggedMessage).toBe(
        "Failed with Bearer [REDACTED] and Sign: [REDACTED_SIGN]",
      );
    });
  });
});
