"use client";
import { useCallback, useState } from "react";
import { usePublicClient, useReadContract, useWalletClient } from "wagmi";
import type { Hex } from "viem";
import { aeneid, multiSigConditionAbi } from "@cdr-kit/contracts";

/**
 * MultiSigCondition React surface — kept in its own file because condition-hooks.ts crossed the
 * 400-line ceiling once `useSignMultiSigApproval` landed. Splitting by condition family also
 * mirrors how the contracts are split, and gives MultiSig consumers a single point to grep
 * (the dual-path approval flow is genuinely the most surface area of any 0.5 condition).
 */

/* ============================================================ */
/* read state                                                    */
/* ============================================================ */

export interface MultiSigStatus {
  signers: readonly Hex[];
  threshold: number;
  epoch: bigint;
  /** On-chain `approve()` count for the current epoch. Truth source when signers used the
   *  Safe-style path. Off-chain EIP-712 sigs are NOT counted here (they're submitted at read
   *  time, not stored) — combine with the dashboard's own sig-collection state if needed. */
  onChainApprovals: number;
  isLoading: boolean;
}

/** Read the current multi-sig config + on-chain approval count for a uuid. Both the off-chain
 *  EIP-712 path and the on-chain `approve()` path are valid — `onChainApprovals >= threshold`
 *  means the vault can be read without submitting any sigs in accessAuxData. */
export function useMultiSigStatus(uuid: number, address: Hex = aeneid.multiSigCondition as Hex): MultiSigStatus {
  const read = useReadContract({
    address,
    abi: multiSigConditionAbi,
    functionName: "getConfig",
    args: [uuid],
  });
  const countRead = useReadContract({
    address,
    abi: multiSigConditionAbi,
    functionName: "currentApprovalsCount",
    args: [uuid],
    // Polls every 4s so a signer pressing approve() in another tab shows up in the dashboard
    // within the next refresh window — without paying for a websocket subscription. Consumers
    // who want lower latency can wire `useWatchContractEvent` on `Approved` themselves.
    query: { refetchInterval: 4000 },
  });
  const d = read.data as readonly [readonly Hex[], number, bigint] | undefined;
  return {
    signers: d?.[0] ?? [],
    threshold: d?.[1] ?? 0,
    epoch: d?.[2] ?? 0n,
    onChainApprovals: Number((countRead.data as bigint | undefined) ?? 0n),
    isLoading: read.isLoading || countRead.isLoading,
  };
}

/* ============================================================ */
/* on-chain approve path                                         */
/* ============================================================ */

/** Signer-side: on-chain Safe-style `approve(uuid, expectedEpoch)`. The hook fetches the current
 *  epoch from `getConfig` immediately before sending the tx so the signer's intent is bound to a
 *  specific signer set/threshold. If a rotation lands between the read and the send, the contract
 *  reverts with `EpochChanged(expected, current)` — the UI should re-prompt against the new state
 *  rather than silently authorize against a config the signer didn't see. */
export function useApproveMultiSig(
  uuid: number,
  address: Hex = aeneid.multiSigCondition as Hex,
): () => Promise<Hex> {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  return useCallback(async () => {
    if (!walletClient) throw new Error("connect a wallet to approve");
    if (!publicClient) throw new Error("public client unavailable");
    const cfg = (await publicClient.readContract({
      address,
      abi: multiSigConditionAbi,
      functionName: "getConfig",
      args: [uuid],
    })) as readonly [readonly Hex[], number, bigint];
    return walletClient.writeContract({
      address,
      abi: multiSigConditionAbi,
      functionName: "approve",
      args: [uuid, cfg[2]],
      chain: walletClient.chain ?? null,
      account: walletClient.account!,
    });
  }, [walletClient, publicClient, address, uuid]);
}

/* ============================================================ */
/* off-chain sign path                                           */
/* ============================================================ */

export interface SignMultiSigApprovalParams {
  /** Unix-seconds deadline after which the sig is rejected. Default: 1 hour from now. */
  deadline?: bigint;
  /** Address that will ultimately submit the read tx. Sig is bound to this address — anyone else
   *  trying to use it will fail recovery. Defaults to the connected wallet (sig is for self-use). */
  caller?: Hex;
}

export interface UseSignMultiSigApprovalResult {
  /** Produce an EIP-712 signature for a multi-sig vault approval. Returns the 65-byte hex sig. */
  sign: (params?: SignMultiSigApprovalParams) => Promise<Hex>;
  /** Last signature produced this session (handy for copy-to-clipboard UIs). */
  signature?: Hex;
  isLoading: boolean;
  error?: Error;
}

/**
 * Signer-side: produce an off-chain EIP-712 approval for a multi-sig vault. The buyer collects
 * `threshold`-many sigs from different signers and submits them as `accessAuxData` via
 * `agent.accessMultiSig({ uuid, deadline, sigs[] })`.
 *
 * Reads the current epoch from `getConfig(uuid)` so the sig is bound to the signer set the
 * signer is currently approving — a `rotateSigners` that lands between sign and submit would
 * invalidate the sig (the contract recomputes the digest with the new epoch and ecrecover
 * returns a different address). The signer can re-sign against the new epoch if they still
 * want to authorize the new set.
 *
 * Pair with `<MultiSigSigner uuid={u}>` for a drop-in sign + copy UI, or call `sign()` directly
 * from your own button + clipboard handler.
 */
export function useSignMultiSigApproval(
  uuid: number,
  address: Hex = aeneid.multiSigCondition as Hex,
): UseSignMultiSigApprovalResult {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [signature, setSignature] = useState<Hex>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const sign = useCallback(
    async (params: SignMultiSigApprovalParams = {}): Promise<Hex> => {
      if (!walletClient) throw new Error("connect a wallet to sign");
      if (!publicClient) throw new Error("public client unavailable");
      setIsLoading(true);
      setError(undefined);
      try {
        const cfg = (await publicClient.readContract({
          address,
          abi: multiSigConditionAbi,
          functionName: "getConfig",
          args: [uuid],
        })) as readonly [readonly Hex[], number, bigint];
        const caller = (params.caller ?? walletClient.account!.address) as Hex;
        const deadline = params.deadline ?? BigInt(Math.floor(Date.now() / 1000) + 3600);
        const sig = await walletClient.signTypedData({
          account: walletClient.account!,
          domain: {
            name: "cdr-kit:MultiSigCondition",
            version: "1",
            chainId: walletClient.chain?.id ?? aeneid.chainId,
            verifyingContract: address,
          },
          types: {
            Approval: [
              { name: "uuid", type: "uint32" },
              { name: "caller", type: "address" },
              { name: "epoch", type: "uint64" },
              { name: "deadline", type: "uint64" },
            ],
          },
          primaryType: "Approval",
          message: { uuid, caller, epoch: cfg[2], deadline },
        });
        setSignature(sig);
        return sig;
      } catch (e) {
        const err = e as Error;
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, publicClient, address, uuid],
  );

  return { sign, signature, isLoading, error };
}

/* ============================================================ */
/* creator: rotation                                             */
/* ============================================================ */

/** Creator-side: swap multi-sig signer set / threshold; bumps epoch which invalidates BOTH
 *  in-flight off-chain sigs AND on-chain approvals from the previous epoch. Signers must be
 *  sorted strictly ascending; helper sorts before the writeContract call. */
export function useRotateMultiSigSigners(
  uuid: number,
  address: Hex = aeneid.multiSigCondition as Hex,
): (params: { signers: Hex[]; threshold: number }) => Promise<Hex> {
  const { data: walletClient } = useWalletClient();
  return useCallback(
    async (params) => {
      if (!walletClient) throw new Error("connect a wallet to rotate signers");
      const sorted = [...params.signers].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1));
      return walletClient.writeContract({
        address,
        abi: multiSigConditionAbi,
        functionName: "rotateSigners",
        args: [uuid, sorted, params.threshold],
        chain: walletClient.chain ?? null,
        account: walletClient.account!,
      });
    },
    [walletClient, address, uuid],
  );
}
