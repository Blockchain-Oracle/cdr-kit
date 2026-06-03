import "server-only";
import { consola } from "consola";
import type { Hex } from "viem";
import type { CdrFormFields } from "./cdr-form.js";

const log = consola.withTag("cdr-forms");

/** Lazy-import `@cdr-kit/agent` so client-only consumers don't have to install it. */
type CdrAgentModule = typeof import("@cdr-kit/agent");
async function loadAgentModule(): Promise<CdrAgentModule> {
  // Hide the literal specifier from build-time resolution (Vite/Rollup static-analysis trap).
  // Pattern documented in CLAUDE.md (the storage-adapter ecosystem).
  const dynamicImport = new Function("s", "return import(s)") as (s: string) => Promise<CdrAgentModule>;
  return dynamicImport("@cdr-kit/agent");
}

export interface StoreFormSubmissionParams {
  /** Hex private key of the wallet that pays for vault creation + writes. */
  privateKey: Hex;
  /** Override the network's canonical RPC URL. */
  rpcUrl?: string;
  /** Defaults to OpenCondition (anyone-can-read) — pass a tighter gate for production. */
  readConditionAddr?: Hex;
  /** ABI-encoded config for `readConditionAddr`. Defaults to "0x" (no config). */
  readConditionData?: Hex;
}

export interface StoreFormSubmissionResult {
  /** Global CDR vault counter — use to read the submission back. */
  vaultId: number;
}

/**
 * Encrypt + store a form submission in a new CDR vault.
 * Creates a vault, writes `JSON.stringify({ answers, submittedAt })` as encrypted data,
 * and returns the new vault id. Use from a Next.js server action or API route.
 *
 * @param fields The submitted form fields (typically `Object.fromEntries(formData)`).
 * @param params `{ privateKey, rpcUrl?, readConditionAddr?, readConditionData? }`.
 * @returns `{ vaultId }`.
 */
export async function storeFormSubmission(
  fields: CdrFormFields,
  params: StoreFormSubmissionParams,
): Promise<StoreFormSubmissionResult> {
  const { CdrAgent } = await loadAgentModule();
  const { resolveAddresses } = await loadContractsModule();

  const agent = new CdrAgent({ privateKey: params.privateKey, rpcUrl: params.rpcUrl });
  const addrs = resolveAddresses(agent.network);
  const readConditionAddr = params.readConditionAddr ?? (addrs.openCondition as Hex);
  const readConditionData = params.readConditionData ?? "0x";

  log.info({ fields: Object.keys(fields).length }, "storeFormSubmission: creating vault");
  await agent.createVault({ readConditionAddr, readConfig: readConditionData });

  // The factory's VaultCreated event carries the uuid — discover the latest one this wallet
  // just minted by reading creator-vaults and taking the freshest entry.
  if (!agent.address) throw new Error("@cdr-kit/forms: agent has no wallet address");
  const owned = await agent.getCreatorVaults(agent.address);
  const newest = owned[owned.length - 1];
  if (!newest) throw new Error("@cdr-kit/forms: createVault succeeded but no VaultCreated event found");

  const payload = JSON.stringify({ answers: serializeFields(fields), submittedAt: new Date().toISOString() });
  const bytes = new TextEncoder().encode(payload);
  log.info({ uuid: newest.uuid, bytes: bytes.length }, "storeFormSubmission: writing payload");
  await agent.writeVaultData({ uuid: newest.uuid, dataKey: bytes });

  return { vaultId: newest.uuid };
}

export interface ReadFormSubmissionParams {
  /** Hex private key of a wallet authorized to read the vault (creator, signer, …). */
  privateKey: Hex;
  /** Override the network's canonical RPC URL. */
  rpcUrl?: string;
}

export interface ReadFormSubmissionResult {
  /** The decoded form fields. */
  fields: Record<string, string>;
  /** ISO-8601 timestamp written at submit time. */
  submittedAt: string;
}

/**
 * Read + decrypt a form submission stored via {@link storeFormSubmission}.
 * @param vaultId The uuid returned by `storeFormSubmission`.
 * @param params `{ privateKey, rpcUrl? }` — the wallet that pays the read fee.
 * @returns `{ fields, submittedAt }`.
 */
export async function readFormSubmission(
  vaultId: number,
  params: ReadFormSubmissionParams,
): Promise<ReadFormSubmissionResult> {
  const { CdrAgent } = await loadAgentModule();
  const agent = new CdrAgent({ privateKey: params.privateKey, rpcUrl: params.rpcUrl });
  log.info({ vaultId }, "readFormSubmission: accessing vault");
  const bytes = await agent.access(vaultId);
  const payload = JSON.parse(new TextDecoder().decode(bytes)) as {
    answers: Record<string, string>;
    submittedAt: string;
  };
  return { fields: payload.answers, submittedAt: payload.submittedAt };
}

type ContractsModule = typeof import("@cdr-kit/contracts");
async function loadContractsModule(): Promise<ContractsModule> {
  const dynamicImport = new Function("s", "return import(s)") as (s: string) => Promise<ContractsModule>;
  return dynamicImport("@cdr-kit/contracts");
}

/** Form fields can include File objects; we coerce to strings for JSON serialization. */
function serializeFields(fields: CdrFormFields): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = typeof v === "string" ? v : `[file:${(v as File).name ?? "unknown"}]`;
  }
  return out;
}
