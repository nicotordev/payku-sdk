import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { z } from "@nicotordev/payku/zod";
import pkg from "../../../package.json";

describe("Payku Zod subpath export", () => {
  test("exports z instance from @nicotordev/payku/zod package resolution", () => {
    expect(z).toBeDefined();
    expect(typeof z.object).toBe("function");
    expect(typeof z.string).toBe("function");
  });

  test("verifies package.json exports mapping and build artifacts for ./zod", () => {
    expect(pkg.exports).toBeDefined();
    expect(pkg.exports["./zod"]).toBeDefined();
    expect(pkg.exports["./zod"].types).toBe("./dist/zod/index.d.ts");
    expect(pkg.exports["./zod"].import).toBe("./dist/zod/index.js");

    const rootDir = process.cwd();
    const distJs = join(rootDir, "dist/zod/index.js");
    const distDts = join(rootDir, "dist/zod/index.d.ts");

    expect(existsSync(distJs)).toBe(true);
    expect(existsSync(distDts)).toBe(true);
  });
});
