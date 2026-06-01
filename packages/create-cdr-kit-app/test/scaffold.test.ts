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

  it("writes the blog template with Next.js + UnlockablePill wiring", () => {
    base = mkdtempSync(join(tmpdir(), "cdrkit-"));
    const target = join(base, "my-blog");
    scaffold(target, { template: "blog" });

    for (const f of [
      "package.json",
      "tsconfig.json",
      "next.config.ts",
      "next-env.d.ts",
      "app/layout.tsx",
      "app/page.tsx",
      "app/providers.tsx",
      "app/globals.css",
      "scripts/upload.ts",
      "README.md",
      ".gitignore",
      ".env.local.example",
    ]) {
      expect(existsSync(join(target, f)), `${f} should exist`).toBe(true);
    }

    const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    expect(pkg.dependencies["@cdr-kit/react-ui"]).toBe("^0.5.0");
    expect(pkg.dependencies["@cdr-kit/core"]).toBe("^0.5.0");
    expect(pkg.dependencies.next).toBeDefined();
    expect(pkg.scripts.dev).toContain("next");

    const page = readFileSync(join(target, "app/page.tsx"), "utf8");
    expect(page).toContain("UnlockablePill");
    expect(page).toContain("uuid={4242}");

    const providers = readFileSync(join(target, "app/providers.tsx"), "utf8");
    expect(providers).toContain("createMockCdrKit");
    expect(providers).toContain("writeVaultData");

    const upload = readFileSync(join(target, "scripts/upload.ts"), "utf8");
    expect(upload).toContain("uploadFile");
    expect(upload).toContain("WALLET_PRIVATE_KEY");
  });

  it("rejects an unknown template", () => {
    base = mkdtempSync(join(tmpdir(), "cdrkit-"));
    const target = join(base, "x");
    // @ts-expect-error — runtime guard test
    expect(() => scaffold(target, { template: "nope" })).toThrow(/unknown template/);
  });
});
