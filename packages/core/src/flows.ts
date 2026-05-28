import { bytesToHex, type Hex } from "viem";
import { uuidToLabel } from "@piplabs/cdr-sdk";
import { subscriptionConditionAbi, cdrKitVaultAbi } from "@cdr-kit/contracts";
import type { CdrKitClient } from "./client.js";

export type AccessStep = "paying" | "collecting-partials" | "ready";
export type ProgressFn = (step: AccessStep) => void;

function requireWallet(c: CdrKitClient) {
  if (!c.walletClient?.account) throw new Error("cdr-kit: a walletClient with an account is required");
  return c.walletClient;
}

/** Seller: encrypt a data key and write it to an already-allocated vault (the CdrKitVault path). */
export async function writeVaultData(client: CdrKitClient, params: { uuid: number; dataKey: Uint8Array }): Promise<Hex> {
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

/** Buyer/agent: read + decrypt (the ~7-min partial-collection flow). Returns the recovered data key. */
export async function accessVault(
  client: CdrKitClient,
  params: { uuid: number; accessAuxData?: Hex; timeoutMs?: number },
): Promise<Uint8Array> {
  const { dataKey } = await client.cdr.consumer.accessCDR({
    uuid: params.uuid,
    accessAuxData: params.accessAuxData ?? "0x",
    timeoutMs: params.timeoutMs ?? 600_000,
  });
  return dataKey;
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
    account: wallet.account!,
    chain: wallet.chain,
  });
}
