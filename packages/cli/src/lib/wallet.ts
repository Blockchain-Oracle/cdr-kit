import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import envPaths from "env-paths";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";
import type { Network } from "@cdr-kit/contracts";
import { log } from "./logger.js";

export interface WalletFile {
  privateKey: Hex;
  address: Hex;
  network: Network;
  createdAt: string;
}

export type WalletSource = "env" | "file" | "generated";

export interface LoadedWallet {
  privateKey: Hex;
  address: Hex;
  source: WalletSource;
  path: string;
}

const PATHS = envPaths("cdr-kit", { suffix: "" });

export function walletPath(): string {
  return join(PATHS.config, "wallet.json");
}

/**
 * Load (or first-run-generate) the agent wallet. Order: `CDR_PRIVATE_KEY` env →
 * `~/.config/cdr-kit/wallet.json` → freshly generate + write the file (chmod 600).
 *
 * Falls back to the deprecated `PRIVATE_KEY` env (for one release) so existing MCP configs
 * keep working; emits a stderr warning.
 *
 * Prints a first-run banner to stderr when generating so users see address + faucet URL.
 */
export function loadOrCreateWallet(opts: { network?: Network } = {}): LoadedWallet {
  const network = opts.network ?? "aeneid";
  const envKey = (process.env.CDR_PRIVATE_KEY ?? process.env.PRIVATE_KEY) as Hex | undefined;
  if (process.env.CDR_PRIVATE_KEY === undefined && process.env.PRIVATE_KEY !== undefined) {
    log.warn("env PRIVATE_KEY is deprecated; use CDR_PRIVATE_KEY (will stop being honored in 0.5)");
  }
  if (envKey) {
    const account = privateKeyToAccount(envKey);
    return { privateKey: envKey, address: account.address, source: "env", path: "env:CDR_PRIVATE_KEY" };
  }

  const path = walletPath();
  if (existsSync(path)) {
    const raw = readFileSync(path, "utf8");
    const data = JSON.parse(raw) as WalletFile;
    if (!data.privateKey?.startsWith("0x")) {
      throw new Error(`cdr-kit: ${path} is not a valid wallet file (missing 0x privateKey)`);
    }
    return { privateKey: data.privateKey, address: data.address, source: "file", path };
  }

  // First run — generate, persist, banner.
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  mkdirSync(dirname(path), { recursive: true });
  const wallet: WalletFile = {
    privateKey,
    address: account.address,
    network,
    createdAt: new Date().toISOString(),
  };
  writeFileSync(path, JSON.stringify(wallet, null, 2));
  chmodSync(path, 0o600);
  printFirstRunBanner({ address: account.address, network, path });
  return { privateKey, address: account.address, source: "generated", path };
}

function printFirstRunBanner({ address, network, path }: { address: Hex; network: Network; path: string }): void {
  const lines = [
    "",
    "  ┌──────────────────────────────────────────────────────────────────────────────┐",
    "  │  cdr-kit · new wallet generated                                              │",
    `  │  address  ${address.padEnd(67)}│`,
    `  │  network  ${network.padEnd(67)}│`,
    `  │  saved to ${path.padEnd(67)}│`,
    "  │                                                                              │",
    "  │  next:                                                                       │",
    "  │   1. fund it on Aeneid:  cdr fund                                            │",
    "  │      (or visit https://aeneid.faucet.story.foundation/ and paste the addr)   │",
    "  │   2. verify:             cdr wallet                                          │",
    "  │   3. start using:        cdr discover / cdr fees / cdr vault info <uuid>     │",
    "  │                                                                              │",
    "  │  private key never leaves your machine (chmod 600 on the file above).        │",
    "  └──────────────────────────────────────────────────────────────────────────────┘",
    "",
  ];
  for (const line of lines) process.stderr.write(line + "\n");
}
