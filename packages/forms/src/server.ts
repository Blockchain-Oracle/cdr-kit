import "server-only";
import { consola } from "consola";
import type { Hex } from "viem";
// Type-only — erased at build. The runtime values for these modules are loaded
// via the lazy-import pattern below so client-only consumers don't have to
// install them.
import type { CdrStorageProvider } from "@cdr-kit/core";
import type { CdrFormFields } from "./cdr-form.js";

const log = consola.withTag("cdr-forms");

type CdrAgentModule = typeof import("@cdr-kit/agent");
type CdrCoreModule = typeof import("@cdr-kit/core");
type CdrContractsModule = typeof import("@cdr-kit/contracts");

function dynamicImport<T>(specifier: string): Promise<T> {
  // Hide the literal specifier from build-time resolution (Vite/Rollup static-analysis trap).
  // Same pattern as the storage-adapter ecosystem in @cdr-kit/core (CLAUDE.md).
  const dyn = new Function("s", "return import(s)") as (s: string) => Promise<T>;
  return dyn(specifier);
}

const loadAgentModule = () => dynamicImport<CdrAgentModule>("@cdr-kit/agent");
const loadCoreModule = () => dynamicImport<CdrCoreModule>("@cdr-kit/core");
const loadContractsModule = () => dynamicImport<CdrContractsModule>("@cdr-kit/contracts");

export interface StoreFormSubmissionParams {
  /** Hex private key of the wallet that pays for vault creation + writes. */
  privateKey: Hex;
  /**
   * The `CdrStorageProvider` adapter the encrypted form payload uploads through.
   *
   * Build with one of the six factories from `@cdr-kit/core`:
   * `createPinataStorage` · `createSupabaseStorage` · `createIpfsStorage`
   * `createS3Storage` · `createStorachaStorage` · `createHeliaStorage`
   *
   * Storage is **required** — the form's encrypted bytes have to land somewhere
   * the read path can fetch them from. Configure the adapter in server code
   * with env vars (PINATA_JWT, SUPABASE_URL+KEY, etc.); never expose the choice
   * to respondents.
   */
  storage: CdrStorageProvider;
  /** Override the network's canonical RPC URL. Defaults to Aeneid testnet. */
  rpcUrl?: string;
  /** Defaults to OpenCondition (anyone-can-read) — pass a tighter gate for production. */
  readConditionAddr?: Hex;
  /** ABI-encoded config for `readConditionAddr`. Defaults to "0x" (no config). */
  readConditionData?: Hex;
  /** Pin the IPFS CID after upload. Defaults to `true`. */
  pin?: boolean;
}

export interface StoreFormSubmissionResult {
  /** Global CDR vault counter — use to read the submission back. */
  vaultId: number;
  /** IPFS CID returned by the storage adapter — useful for audit logs. */
  cid: string;
  /** Allocate + write tx hashes for on-chain receipts. */
  txHashes: { allocate: Hex; write: Hex };
}

/**
 * Encrypt + store a form submission via the supplied storage adapter.
 *
 * Server-only. Call from a Next.js route handler or server action with a
 * pre-configured `storage`. The respondent never picks or constructs the
 * adapter — the developer wires it once with env-backed credentials.
 *
 * @param fields The submitted form fields (typically `Object.fromEntries(formData)`).
 * @param params `{ privateKey, storage, rpcUrl?, readConditionAddr?, readConditionData?, pin? }`.
 * @returns `{ vaultId, cid, txHashes }`.
 */
export async function storeFormSubmission(
  fields: CdrFormFields,
  params: StoreFormSubmissionParams,
): Promise<StoreFormSubmissionResult> {
  if (!params.storage) {
    throw new Error(
      "@cdr-kit/forms: storeFormSubmission requires a CdrStorageProvider — " +
        "build one with createPinataStorage / createSupabaseStorage / createIpfsStorage / " +
        "createS3Storage / createStorachaStorage / createHeliaStorage from @cdr-kit/core.",
    );
  }

  const [{ CdrAgent }, core, contracts] = await Promise.all([
    loadAgentModule(),
    loadCoreModule(),
    loadContractsModule(),
  ]);
  const { uploadFile } = core;
  const { resolveAddresses } = contracts;

  const agent = new CdrAgent({ privateKey: params.privateKey, rpcUrl: params.rpcUrl });
  const addrs = resolveAddresses(agent.network);
  const readConditionAddr = params.readConditionAddr ?? (addrs.openCondition as Hex);
  const readConditionData = params.readConditionData ?? "0x";

  const payload = JSON.stringify({
    answers: serializeFields(fields),
    submittedAt: new Date().toISOString(),
  });
  const bytes = new TextEncoder().encode(payload);

  log.info(
    { fields: Object.keys(fields).length, bytes: bytes.length },
    "storeFormSubmission: uploading via storage adapter",
  );

  // CdrAgent already holds a CdrKitClient — reuse it instead of constructing a second one.
  const res = await uploadFile(agent.client, {
    content: bytes,
    storage: params.storage,
    readConditionAddr,
    readConditionData,
    pin: params.pin ?? true,
  });

  log.success({ uuid: res.uuid, cid: res.cid }, "storeFormSubmission: stored");
  return { vaultId: res.uuid, cid: res.cid, txHashes: res.txHashes };
}

export interface ReadFormSubmissionParams {
  /** Hex private key of a wallet authorized to read the vault. */
  privateKey: Hex;
  /** Same storage adapter used to write — needed to download the blob. */
  storage: CdrStorageProvider;
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
 * @param params `{ privateKey, storage, rpcUrl? }`.
 * @returns `{ fields, submittedAt }`.
 */
export async function readFormSubmission(
  vaultId: number,
  params: ReadFormSubmissionParams,
): Promise<ReadFormSubmissionResult> {
  if (!params.storage) {
    throw new Error(
      "@cdr-kit/forms: readFormSubmission requires the same CdrStorageProvider used to write.",
    );
  }

  const [{ CdrAgent }, core] = await Promise.all([loadAgentModule(), loadCoreModule()]);
  const { downloadFile } = core;

  const agent = new CdrAgent({ privateKey: params.privateKey, rpcUrl: params.rpcUrl });

  log.info({ vaultId }, "readFormSubmission: downloading via storage adapter");
  const { content } = await downloadFile(agent.client, { uuid: vaultId, storage: params.storage });
  const payload = JSON.parse(new TextDecoder().decode(content)) as {
    answers: Record<string, string>;
    submittedAt: string;
  };
  return { fields: payload.answers, submittedAt: payload.submittedAt };
}

/** Form fields can include File objects; we coerce to strings for JSON serialization. */
export function serializeFields(fields: CdrFormFields): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === "string") {
      out[k] = v;
    } else if (v && typeof v === "object" && "name" in v) {
      out[k] = `[file:${(v as { name: string }).name}]`;
    } else {
      out[k] = String(v ?? "");
    }
  }
  return out;
}
