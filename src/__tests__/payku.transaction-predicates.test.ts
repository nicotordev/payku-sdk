import { describe, expect, test } from "bun:test";
import Payku, {
  isTransactionFailed,
  isTransactionPaid,
  isTransactionPending,
  isTransactionSuccess,
  extractTransactionStatus,
  PaykuTransactions,
} from "../index";
import type {
  PaykuGetTransactionResponse,
  PaykuNotifyPayload,
  PaykuTransaction,
} from "../types/payku.transactions";

describe("Transaction Predicates & Type Guards (Issue #173)", () => {
  describe("extractTransactionStatus", () => {
    test("extracts exact status from strings without modifying them", () => {
      expect(extractTransactionStatus("success")).toBe("success");
      expect(extractTransactionStatus("SUCCESS")).toBe("SUCCESS");
      expect(extractTransactionStatus("  pending  ")).toBe("  pending  ");
      expect(extractTransactionStatus("REGISTER")).toBe("REGISTER");
    });

    test("extracts exact status from objects with status without modifying them", () => {
      expect(extractTransactionStatus({ status: "success" })).toBe("success");
      expect(extractTransactionStatus({ status: "Pending " })).toBe("Pending ");
      expect(extractTransactionStatus({ status: "REJECTED" })).toBe("REJECTED");
      expect(extractTransactionStatus({ status: "" })).toBe("");
      expect(extractTransactionStatus({ status: 123 })).toBeUndefined();
      expect(extractTransactionStatus({ status: null })).toBeUndefined();
      expect(extractTransactionStatus({})).toBeUndefined();
    });

    test("returns undefined for primitives and null/undefined", () => {
      expect(extractTransactionStatus(null)).toBeUndefined();
      expect(extractTransactionStatus(undefined)).toBeUndefined();
      expect(extractTransactionStatus(123)).toBeUndefined();
      expect(extractTransactionStatus(true)).toBeUndefined();
    });
  });

  describe("isTransactionPaid / isTransactionSuccess", () => {
    test("returns true for exact canonical success status", () => {
      expect(isTransactionPaid({ status: "success" })).toBe(true);
      expect(isTransactionPaid("success")).toBe(true);

      // isTransactionSuccess alias
      expect(isTransactionSuccess({ status: "success" })).toBe(true);
      expect(isTransactionSuccess("success")).toBe(true);
    });

    test("returns false for non-canonical casing, untrimmed strings, and other statuses", () => {
      expect(isTransactionPaid({ status: "SUCCESS" })).toBe(false);
      expect(isTransactionPaid({ status: " success " })).toBe(false);
      expect(isTransactionPaid("SUCCESS")).toBe(false);
      expect(isTransactionPaid(" success ")).toBe(false);
      expect(isTransactionPaid({ status: "pending" })).toBe(false);
      expect(isTransactionPaid({ status: "register" })).toBe(false);
      expect(isTransactionPaid({ status: "rejected" })).toBe(false);
      expect(isTransactionPaid({ status: "failed" })).toBe(false);
      expect(isTransactionPaid("pending")).toBe(false);
      expect(isTransactionPaid("rejected")).toBe(false);
      expect(isTransactionPaid(null)).toBe(false);
      expect(isTransactionPaid(undefined)).toBe(false);
      expect(isTransactionPaid({})).toBe(false);
    });

    test("narrows type in TypeScript", () => {
      const tx: PaykuGetTransactionResponse = {
        id: "tx-1",
        status: "success",
      };

      if (isTransactionPaid(tx)) {
        // Compile-time check: tx.status is narrowed to "success"
        const status: "success" = tx.status;
        expect(status).toBe("success");
      } else {
        throw new Error("Should have been identified as paid");
      }
    });
  });

  describe("isTransactionPending", () => {
    test("returns true for exact canonical pending and register statuses", () => {
      expect(isTransactionPending({ status: "pending" })).toBe(true);
      expect(isTransactionPending({ status: "register" })).toBe(true);
      expect(isTransactionPending("pending")).toBe(true);
      expect(isTransactionPending("register")).toBe(true);
    });

    test("returns false for non-canonical casing, untrimmed, or other statuses", () => {
      expect(isTransactionPending({ status: "PENDING" })).toBe(false);
      expect(isTransactionPending({ status: " REGISTER " })).toBe(false);
      expect(isTransactionPending("PENDING")).toBe(false);
      expect(isTransactionPending(" register ")).toBe(false);
      expect(isTransactionPending({ status: "success" })).toBe(false);
      expect(isTransactionPending({ status: "rejected" })).toBe(false);
      expect(isTransactionPending({ status: "failed" })).toBe(false);
      expect(isTransactionPending("success")).toBe(false);
      expect(isTransactionPending("rejected")).toBe(false);
      expect(isTransactionPending(null)).toBe(false);
      expect(isTransactionPending(undefined)).toBe(false);
      expect(isTransactionPending({})).toBe(false);
    });

    test("narrows type in TypeScript", () => {
      const tx: PaykuTransaction = {
        id: "tx-2",
        status: "pending",
      };

      if (isTransactionPending(tx)) {
        // Compile-time check: tx.status is narrowed to "pending" | "register"
        const status: "pending" | "register" = tx.status;
        expect(status).toBe("pending");
      } else {
        throw new Error("Should have been identified as pending");
      }
    });
  });

  describe("isTransactionFailed", () => {
    test("returns true for exact canonical rejected and failed statuses", () => {
      expect(isTransactionFailed({ status: "rejected" })).toBe(true);
      expect(isTransactionFailed({ status: "failed" })).toBe(true);
      expect(isTransactionFailed("rejected")).toBe(true);
      expect(isTransactionFailed("failed")).toBe(true);
    });

    test("returns false for non-canonical casing, untrimmed, or other statuses", () => {
      expect(isTransactionFailed({ status: "REJECTED" })).toBe(false);
      expect(isTransactionFailed({ status: " FAILED " })).toBe(false);
      expect(isTransactionFailed("REJECTED")).toBe(false);
      expect(isTransactionFailed(" failed ")).toBe(false);
      expect(isTransactionFailed({ status: "success" })).toBe(false);
      expect(isTransactionFailed({ status: "pending" })).toBe(false);
      expect(isTransactionFailed({ status: "register" })).toBe(false);
      expect(isTransactionFailed("success")).toBe(false);
      expect(isTransactionFailed("pending")).toBe(false);
      expect(isTransactionFailed(null)).toBe(false);
      expect(isTransactionFailed(undefined)).toBe(false);
      expect(isTransactionFailed({})).toBe(false);
    });

    test("works with webhook notify payloads", () => {
      const notifySuccess: PaykuNotifyPayload = {
        transaction_id: "1",
        payment_key: "k1",
        transaction_key: "tk1",
        verification_key: "vk1",
        order: "ord-1",
        status: "success",
      };

      const notifyFailed: PaykuNotifyPayload = {
        transaction_id: "2",
        payment_key: "k2",
        transaction_key: "tk2",
        verification_key: "vk2",
        order: "ord-2",
        status: "failed",
      };

      expect(isTransactionPaid(notifySuccess)).toBe(true);
      expect(isTransactionFailed(notifySuccess)).toBe(false);

      expect(isTransactionPaid(notifyFailed)).toBe(false);
      expect(isTransactionFailed(notifyFailed)).toBe(true);
    });
  });

  describe("Hybrid DX: payku.transactions methods", () => {
    const payku = new Payku("pub-test", "priv-test");

    test("instance methods on payku.transactions work identically", () => {
      const paidTx = { status: "success" };
      const pendingTx = { status: "pending" };
      const registerTx = { status: "register" };
      const failedTx = { status: "rejected" };

      expect(payku.transactions.isPaid(paidTx)).toBe(true);
      expect(payku.transactions.isSuccess(paidTx)).toBe(true);
      expect(payku.transactions.isPending(paidTx)).toBe(false);
      expect(payku.transactions.isFailed(paidTx)).toBe(false);

      expect(payku.transactions.isPending(pendingTx)).toBe(true);
      expect(payku.transactions.isPending(registerTx)).toBe(true);
      expect(payku.transactions.isFailed(failedTx)).toBe(true);
    });

    test("static methods on PaykuTransactions work identically", () => {
      expect(PaykuTransactions.isPaid({ status: "success" })).toBe(true);
      expect(PaykuTransactions.isSuccess({ status: "success" })).toBe(true);
      expect(PaykuTransactions.isPending({ status: "register" })).toBe(true);
      expect(PaykuTransactions.isFailed({ status: "rejected" })).toBe(true);
    });

    test("methods on country-scoped transactions work identically", () => {
      const chile = Payku.forCountry("CL", {
        publicToken: "pub-test",
        privateToken: "priv-test",
      });

      expect(chile.transactions.isPaid({ status: "success" })).toBe(true);
      expect(chile.transactions.isSuccess({ status: "success" })).toBe(true);
      expect(chile.transactions.isPending({ status: "pending" })).toBe(true);
      expect(chile.transactions.isFailed({ status: "rejected" })).toBe(true);
    });
  });
});
