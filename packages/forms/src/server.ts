import "server-only";
import { consola } from "consola";
import { encodeAbiParameters, parseEventLogs, type Hex } from "viem";
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

/** Payloads at or below this byte count use the direct CDR-precompile write (no IPFS).
 *  Anything larger needs an external `storage` adapter because the precompile rejects
 *  >1KB writes. Matches @cdr-kit/agent's writeVaultData "small data key" semantics. */
const SMALL_PAYLOAD_BYTES = 1024;

export interface StoreFormSubmissionParams {
  /** Hex private key of the wallet that pays for vault creation + writes. */
  privateKey: Hex;
  /**
   * Optional `CdrStorageProvider` adapter — only needed when the encrypted payload
   * exceeds 1KB. For typical form submissions (a few small fields), leave this
   * undefined and the data writes directly through the CDR precompile.
   *
   * Build with one of the six factories from `@cdr-kit/core` when you need it:
   * `createPinataStorage` · `createSupabaseStorage` · `createIpfsStorage`
   * `createS3Storage` · `createStorachaStorage` · `createHeliaStorage`
   *
   * Configure with env vars in server code (PINATA_JWT, SUPABASE_URL+KEY, etc.);
   * never expose the choice to respondents.
   */
  storage?: CdrStorageProvider;
  /** Override the network's canonical RPC URL. Defaults to Aeneid testnet. */
  rpcUrl?: string;
  /**
   * Read condition address. Defaults to `aeneid.timeWindowCondition` with an
   * always-open window (startTs=1, endTs=0) — the simplest factory-compatible
   * "anyone can read" gate while the OpenCondition factory-config patch ships.
   * Pass a tighter gate for production (e.g. creatorWriteCondition for owner-only).
   */
  readConditionAddr?: Hex;
  /** ABI-encoded config for `readConditionAddr`. Defaults match the always-open
   *  TimeWindow encoding `(uint64 startTs=1, uint64 endTs=0, bool blockBased=false)`. */
  readConditionData?: Hex;
  /** Pin the IPFS CID after upload (only used when `storage` is provided). Defaults to `true`. */
  pin?: boolean;
}

export interface StoreFormSubmissionResult {
  /** Global CDR vault counter — use to read the submission back. */
  vaultId: number;
  /** IPFS CID returned by the storage adapter — `null` for small-payload direct writes. */
  cid: string | null;
  /** On-chain tx hashes for receipts: createVault + write. */
  txHashes: { create: Hex; write: Hex };
}

/**
 * Encrypt + store a form submission.
 *
 * Small payloads (≤1KB, the typical form case) write directly to the CDR
 * precompile — no IPFS, no external storage. Large payloads need a
 * `CdrStorageProvider` adapter passed in.
 *
 * Server-only. Call from a Next.js route handler or server action.
 *
 * @param fields The submitted form fields (typically `Object.fromEntries(formData)`).
 * @param params `{ privateKey, storage?, rpcUrl?, readConditionAddr?, readConditionData?, pin? }`.
 * @returns `{ vaultId, cid, txHashes }`.
 */
export async function storeFormSubmission(
  fields: CdrFormFields,
  params: StoreFormSubmissionParams,
): Promise<StoreFormSubmissionResult> {
  const [{ CdrAgent }, core, contracts] = await Promise.all([
    loadAgentModule(),
    loadCoreModule(),
    loadContractsModule(),
  ]);
  const { uploadFile } = core;
  const { resolveAddresses, cdrKitVaultAbi } = contracts;

  const agent = new CdrAgent({ privateKey: params.privateKey, rpcUrl: params.rpcUrl });
  const addrs = resolveAddresses(agent.network);

  // Default to TimeWindowCondition (1, 0, false) = "open from genesis, no end".
  // OpenCondition exists but isn't factory-config compatible on the 0.7.x deployment.
  const readConditionAddr =
    params.readConditionAddr ?? (addrs.timeWindowCondition as Hex);
  const readConditionData =
    params.readConditionData ??
    encodeAbiParameters(
      [{ type: "uint64" }, { type: "uint64" }, { type: "bool" }],
      [1n, 0n, false],
    );

  const payload = JSON.stringify({
    answers: serializeFields(fields),
    submittedAt: new Date().toISOString(),
  });
  const bytes = new TextEncoder().encode(payload);

  // Large payload → external storage adapter (IPFS/S3/etc.)
  if (bytes.length > SMALL_PAYLOAD_BYTES) {
    if (!params.storage) {
      throw new Error(
        `@cdr-kit/forms: payload is ${bytes.length} bytes (>${SMALL_PAYLOAD_BYTES}); needs a CdrStorageProvider. ` +
          "Build one with createPinataStorage / createSupabaseStorage / createIpfsStorage / " +
          "createS3Storage / createStorachaStorage / createHeliaStorage from @cdr-kit/core.",
      );
    }
    log.info(
      { fields: Object.keys(fields).length, bytes: bytes.length },
      "storeFormSubmission: uploading via storage adapter (large payload)",
    );
    const res = await uploadFile(agent.client, {
      content: bytes,
      storage: params.storage,
      readConditionAddr,
      readConditionData,
      pin: params.pin ?? true,
    });
    log.success({ uuid: res.uuid, cid: res.cid }, "storeFormSubmission: stored");
    return {
      vaultId: res.uuid,
      cid: res.cid,
      txHashes: { create: res.txHashes.allocate, write: res.txHashes.write },
    };
  }

  // Small payload → direct CDR precompile write (no IPFS).
  log.info(
    { fields: Object.keys(fields).length, bytes: bytes.length },
    "storeFormSubmission: writing directly via CDR precompile (small payload)",
  );

  // The CDR precompile charges an allocate fee — must be passed as msg.value.
  const fees = await agent.getFees();
  const createTx = await agent.createVault({
    readConditionAddr,
    readConfig: readConditionData,
    valueWei: fees.allocateWei,
  });

  // Derive the uuid from the VaultCreated event in the receipt (avoids
  // post-tx read race that getCreatorVaults hits).
  const receipt = await agent.client.publicClient.waitForTransactionReceipt({ hash: createTx });
  const events = parseEventLogs({
    abi: cdrKitVaultAbi,
    logs: receipt.logs,
    eventName: "VaultCreated",
  });
  if (events.length === 0)
    throw new Error("@cdr-kit/forms: createVault tx confirmed but no VaultCreated event found");
  const uuid = Number(events[0]!.args.uuid);

  const writeTx = await agent.writeVaultData({ uuid, dataKey: bytes });

  log.success({ uuid, createTx, writeTx }, "storeFormSubmission: stored");
  return { vaultId: uuid, cid: null, txHashes: { create: createTx, write: writeTx } };
}

export interface ReadFormSubmissionParams {
  /** Hex private key of a wallet authorized to read the vault. */
  privateKey: Hex;
  /** Same storage adapter used to write — only needed if the original write went
   *  through an adapter (large payload). For small payloads (≤1KB) leave undefined. */
  storage?: CdrStorageProvider;
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
 *
 * If the original write used an external `storage` adapter (large payload),
 * pass the same adapter here. For small payloads (no storage), leave it undefined.
 *
 * @param vaultId The uuid returned by `storeFormSubmission`.
 * @param params `{ privateKey, storage?, rpcUrl? }`.
 * @returns `{ fields, submittedAt }`.
 */
export async function readFormSubmission(
  vaultId: number,
  params: ReadFormSubmissionParams,
): Promise<ReadFormSubmissionResult> {
  const [{ CdrAgent }, core] = await Promise.all([loadAgentModule(), loadCoreModule()]);
  const { downloadFile } = core;

  const agent = new CdrAgent({ privateKey: params.privateKey, rpcUrl: params.rpcUrl });

  let bytes: Uint8Array;
  if (params.storage) {
    log.info({ vaultId }, "readFormSubmission: downloading via storage adapter");
    const { content } = await downloadFile(agent.client, {
      uuid: vaultId,
      storage: params.storage,
    });
    bytes = content;
  } else {
    log.info({ vaultId }, "readFormSubmission: reading directly via CDR precompile");
    bytes = await agent.access(vaultId);
  }

  const payload = JSON.parse(new TextDecoder().decode(bytes)) as {
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
