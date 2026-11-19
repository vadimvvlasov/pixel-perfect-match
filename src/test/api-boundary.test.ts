import { it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
it("isolates network calls to the HTTP service", () => {
  const violations: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) visit(p);
      else if (
        /\.[tj]sx?$/.test(p) &&
        !p.includes("/test/") &&
        p !== "src/server.ts" &&
        !p.includes("/services/api/http/")
      ) {
        const source = readFileSync(p, "utf8");
        if (/\bfetch\s*\(|["']\/api\//.test(source)) violations.push(p);
      }
    }
  };
  visit("src");
  expect(violations).toEqual([]);
});
