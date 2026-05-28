import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffold } from "../src/index.js";

describe("create-cdr-kit-app scaffold", () => {
  let base: string | undefined;
  afterEach(() => {
    if (base) rmSync(base, { recursive: true, force: true });
    base = undefined;
  });

  it("writes a runnable mock-mode starter tree", () => {
    base = mkdtempSync(join(tmpdir(), "cdrkit-"));
    const target = join(base, "my-app");
    scaffold(target);

    for (const f of ["package.json", "tsconfig.json", "README.md", ".gitignore", "src/index.ts"]) {
      expect(existsSync(join(target, f)), `${f} should exist`).toBe(true);
    }
    const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    expect(pkg.dependencies["@cdr-kit/core"]).toBeDefined();
    expect(pkg.scripts.start).toContain("tsx");

    const index = readFileSync(join(target, "src", "index.ts"), "utf8");
    expect(index).toContain("createMockCdrKit");
    expect(index).toContain("accessVault");
  });

  it("refuses to overwrite an existing path", () => {
    base = mkdtempSync(join(tmpdir(), "cdrkit-"));
    const target = join(base, "a");
    scaffold(target);
    expect(() => scaffold(target)).toThrow(/refusing to overwrite/);
  });
});
