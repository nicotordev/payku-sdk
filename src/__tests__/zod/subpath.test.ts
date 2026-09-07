import { describe, expect, test } from "bun:test";
import { z } from "../../zod";

describe("Payku Zod subpath export", () => {
  test("exports z instance from zod module", () => {
    expect(z).toBeDefined();
    expect(typeof z.object).toBe("function");
    expect(typeof z.string).toBe("function");
  });
});
