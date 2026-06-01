#!/usr/bin/env node
// Copies the multi-skill plugin from the workspace into @cdr-kit/cli's plugin/ directory
// so the published tarball ships it. `cdr skill install` reads from this location at runtime.
import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "..", "..", "plugin", "cdr-kit");
const dst = resolve(here, "..", "plugin", "cdr-kit");

if (!existsSync(src)) {
  process.stderr.write(`[copy-plugin] source missing: ${src}\n`);
  process.exit(1);
}
if (existsSync(dst)) rmSync(dst, { recursive: true, force: true });
mkdirSync(dirname(dst), { recursive: true });
cpSync(src, dst, { recursive: true });
process.stderr.write(`[copy-plugin] ${src} → ${dst}\n`);
