import { bytesToHex, type Hex } from "viem";
import { uuidToLabel, EmptyVaultError, PartialCollectionTimeoutError } from "@piplabs/cdr-sdk";
import { subscriptionConditionAbi, cdrKitVaultAbi } from "@cdr-kit/contracts";
import type { CdrKitClient } from "./client.js";
import { ensureWasm } from "./wasm.js";
import { CdrError, CdrErrors } from "./errors.js";

export type AccessStep = "paying" | "collecting-partials" | "ready";
export type ProgressFn = (step: AccessStep) => void;

function requireWallet(c: CdrKitClient) {
  if (!c.walletClient?.account) throw CdrErrors.walletRequired();
  return c.walletClient;
}

/** Seller: encrypt a data key and write it to an already-allocated vault (the CdrKitVault path). */
export async function writeVaultData(client: CdrKitClient, params: { uuid: number; dataKey: Uint8Array }): Promise<Hex> {
  await ensureWasm();
  const ciphertext = await client.cdr.uploader.encryptDataKey({
    dataKey: params.dataKey,
    label: uuidToLabel(params.uuid),
  });
  const { txHash } = await client.cdr.uploader.write({
    uuid: params.uuid,
    accessAuxData: "0x",
    encryptedData: bytesToHex(ciphertext.raw),
  });
  return txHash;
}

/** Buyer/agent: read + decrypt (the ~7-min partial-collection flow). Returns the recovered data key.
 *  `onProgress` reports the live phase (`collecting-partials` → `ready`). Determinate partial counts
 *  are not exposed by the SDK's one-shot `accessCDR`, so the live signal is phase-based, not a tick
 *  count (mock mode reports determinate `collected/threshold`). */
export async function accessVault(
  client: CdrKitClient,
  params: { uuid: number; accessAuxData?: Hex; timeoutMs?: number; onProgress?: ProgressFn },
): Promise<Uint8Array> {
  await ensureWasm();
  // Default aligned to Story CDR SDK docs (`accessCDR` example uses 120_000ms; server-side
  // partial-collection cap is ~7 minutes / 200 blocks). Was 600_000.
  const timeoutMs = params.timeoutMs ?? 120_000;
  params.onProgress?.("collecting-partials");
  try {
    const { dataKey } = await client.cdr.consumer.accessCDR({
      uuid: params.uuid,
      accessAuxData: params.accessAuxData ?? "0x",
      timeoutMs,
    });
    params.onProgress?.("ready");
    return dataKey;
  } catch (e) {
    if (e instanceof EmptyVaultError) throw CdrErrors.vaultNotFound(params.uuid);
    if (e instanceof PartialCollectionTimeoutError) throw CdrErrors.readTimeout(timeoutMs, e);
    if (CdrError.is(e)) throw e;
    throw CdrErrors.keeperUnavailable(e);
  }
}

/** Warm the validator registry/attestation cache so the next access returns from a warm cache
 *  (cuts the first-read stall). Best-effort — swallows errors. Call on wallet-connect. */
export async function prefetchVault(client: CdrKitClient): Promise<void> {
  await client.cdr.consumer.prefetchRegistry().catch(() => undefined);
}

/** Buyer: subscribe (mutating tx) then access — the 2-step pattern (a view condition can't take payment). */
export async function subscribeAndAccess(
  client: CdrKitClient,
  params: {
    subscriptionCondition: Hex;
    uuid: number;
    periods: bigint;
    maxPricePerPeriod: bigint;
    value: bigint;
    accessAuxData?: Hex;
    timeoutMs?: number;
    onProgress?: ProgressFn;
  },
): Promise<Uint8Array> {
  const wallet = requireWallet(client);
  params.onProgress?.("paying");
  const hash = await wallet.writeContract({
    address: params.subscriptionCondition,
    abi: subscriptionConditionAbi,
    functionName: "subscribe",
    args: [params.uuid, params.periods, params.maxPricePerPeriod],
    value: params.value,
    account: wallet.account!,
    chain: wallet.chain,
  });
  await client.publicClient.waitForTransactionReceipt({ hash });
  params.onProgress?.("collecting-partials");
  const data = await accessVault(client, {
    uuid: params.uuid,
    accessAuxData: params.accessAuxData,
    timeoutMs: params.timeoutMs,
  });
  params.onProgress?.("ready");
  return data;
}

/** Seller: create a vault via the CdrKitVault factory (mint NFT -> register IP -> allocate -> configure). */
export async function createVault(
  client: CdrKitClient,
  params: {
    vault: Hex;
    readConditionAddr: Hex;
    readConfig: Hex;
    childConditions?: Hex[];
    childConfigs?: Hex[];
    licenseTermsId?: bigint;
    value?: bigint;
    /** Explicit gas limit. createVault nests a CDR precompile call (allocate) whose gas
     *  eth_estimateGas underestimates → OOG. Default 3M (observed usage ~1M). */
    gas?: bigint;
  },
): Promise<Hex> {
  const wallet = requireWallet(client);
  return wallet.writeContract({
    address: params.vault,
    abi: cdrKitVaultAbi,
    functionName: "createVault",
    args: [
      params.readConditionAddr,
      params.readConfig,
      params.childConditions ?? [],
      params.childConfigs ?? [],
      params.licenseTermsId ?? 0n,
    ],
    value: params.value ?? 0n,
    gas: params.gas ?? 3_000_000n,
    account: wallet.account!,
    chain: wallet.chain,
  });
}
