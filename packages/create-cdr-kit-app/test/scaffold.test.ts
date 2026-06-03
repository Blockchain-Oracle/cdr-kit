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

  it("writes a runnable starter tree (no-mock, real Aeneid)", () => {
    base = mkdtempSync(join(tmpdir(), "cdrkit-"));
    const target = join(base, "my-app");
    scaffold(target);

    for (const f of ["package.json", "tsconfig.json", "README.md", ".gitignore", "src/index.ts", ".env.example"]) {
      expect(existsSync(join(target, f)), `${f} should exist`).toBe(true);
    }
    const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    expect(pkg.dependencies["@cdr-kit/core"]).toBeDefined();
    expect(pkg.dependencies["@cdr-kit/agent"]).toBeDefined();
    expect(pkg.scripts.start).toContain("tsx");

    const index = readFileSync(join(target, "src", "index.ts"), "utf8");
    // 0.7 ships real Aeneid; no mock anywhere
    expect(index).not.toContain("createMockCdrKit");
    expect(index).toContain("new CdrAgent");
    expect(index).toContain("aeneid.storyrpc.io");
    expect(index).toContain("WALLET_PRIVATE_KEY");
    expect(index).toContain("parseEventLogs");
    expect(index).toContain("VaultCreated");
  });

  it("refuses to overwrite an existing path", () => {
    base = mkdtempSync(join(tmpdir(), "cdrkit-"));
    const target = join(base, "a");
    scaffold(target);
    expect(() => scaffold(target)).toThrow(/refusing to overwrite/);
  });

  it("writes the blog template with Next.js + UnlockablePill on real Aeneid", () => {
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
      "app/header.tsx",
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
    expect(pkg.dependencies["@cdr-kit/react-ui"]).toBe("^0.7.0");
    expect(pkg.dependencies["@cdr-kit/core"]).toBe("^0.7.0");
    expect(pkg.dependencies["@rainbow-me/rainbowkit"]).toBeDefined();
    expect(pkg.dependencies.next).toBeDefined();
    expect(pkg.scripts.dev).toContain("next");

    const page = readFileSync(join(target, "app/page.tsx"), "utf8");
    expect(page).toContain("UnlockablePill");
    expect(page).toContain("VAULT_EXHIBIT");

    const providers = readFileSync(join(target, "app/providers.tsx"), "utf8");
    // 0.7 — real Aeneid, no mock
    expect(providers).not.toContain("createMockCdrKit");
    expect(providers).not.toContain("mockKit");
    expect(providers).toContain("WagmiProvider");
    expect(providers).toContain("CdrConfigProvider");
    expect(providers).toContain("RainbowKitProvider");
    expect(providers).toContain("aeneid.storyrpc.io");

    const upload = readFileSync(join(target, "scripts/upload.ts"), "utf8");
    expect(upload).toContain("uploadFile");
    expect(upload).toContain("WALLET_PRIVATE_KEY");
  });

  it("writes the data-marketplace flagship template (live discovery grid)", () => {
    base = mkdtempSync(join(tmpdir(), "cdrkit-"));
    const target = join(base, "my-marketplace");
    scaffold(target, { template: "data-marketplace" });

    for (const f of [
      "package.json",
      "app/page.tsx",
      "app/hero.tsx",
      "app/discovery-grid.tsx",
      "app/providers.tsx",
      "app/header.tsx",
      "README.md",
    ]) {
      expect(existsSync(join(target, f)), `${f} should exist`).toBe(true);
    }

    const grid = readFileSync(join(target, "app/discovery-grid.tsx"), "utf8");
    expect(grid).toContain("useDiscoverVaults");
    expect(grid).toContain("VaultCard");
    expect(grid).toContain("SubscribeButton");
    expect(grid).not.toContain("createMockCdrKit");

    const providers = readFileSync(join(target, "app/providers.tsx"), "utf8");
    expect(providers).not.toContain("createMockCdrKit");
  });

  it("writes the forms template — Pinata adapter wired through lib/storage.ts", () => {
    base = mkdtempSync(join(tmpdir(), "cdrkit-"));
    const target = join(base, "my-forms");
    scaffold(target, { template: "forms" });

    for (const f of [
      "package.json",
      "app/page.tsx",
      "app/results/page.tsx",
      "app/api/respond/route.ts",
      "app/api/results/route.ts",
      "app/providers.tsx",
      "app/header.tsx",
      ".env.local.example",
      "README.md",
    ]) {
      expect(existsSync(join(target, f)), `${f} should exist`).toBe(true);
    }

    const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies["@cdr-kit/forms"]).toBe("^0.7.0");
    expect(pkg.dependencies["@cdr-kit/agent"]).toBeDefined();

    const page = readFileSync(join(target, "app/page.tsx"), "utf8");
    expect(page).toContain("CdrForm");
    expect(page).toContain("CdrField");
    expect(page).toContain("CdrSubmitButton");
    // The respondent form does NOT render StorageProviderPicker — picking a backend
    // is an admin/setup concern (see @cdr-kit/forms exports for that surface), the
    // respondent just fills the form and submits. Keep the scaffolded public page
    // clean of that affordance.
    expect(page).not.toContain("StorageProviderPicker");
    expect(page).not.toContain("createMockCdrKit");

    // lib/storage.ts is no longer required — storage adapter is optional in 0.7.1

    const respond = readFileSync(join(target, "app/api/respond/route.ts"), "utf8");
    expect(respond).toContain("storeFormSubmission");
    expect(respond).toContain("@cdr-kit/forms/server");
    // getStorage helper removed — small payloads bypass storage adapter

    const env = readFileSync(join(target, ".env.local.example"), "utf8");
    expect(env).toContain("WALLET_PRIVATE_KEY");
    // PINATA_JWT now optional (only for >1KB payloads)
  });

  it("rejects an unknown template", () => {
    base = mkdtempSync(join(tmpdir(), "cdrkit-"));
    const target = join(base, "x");
    // @ts-expect-error — runtime guard test
    expect(() => scaffold(target, { template: "nope" })).toThrow(/unknown template/);
  });
});
