import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "bun";
import { describe, expect, test } from "bun:test";
import { z } from "@nicotordev/payku/zod";
import pkg from "../../../package.json";

describe("Payku Zod subpath export", () => {
  test("built package entry points can be imported by Node", () => {
    const result = spawnSync([
      "node",
      "--input-type=module",
      "-e",
      `import assert from "node:assert/strict";
       import Payku from "@nicotordev/payku";
       import { z } from "@nicotordev/payku/zod";
       assert.equal(typeof Payku.forCountry, "function");
       assert.equal(typeof z.object, "function");`,
    ]);

    expect(result.stderr.toString()).toBe("");
    expect(result.exitCode).toBe(0);
  });

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
