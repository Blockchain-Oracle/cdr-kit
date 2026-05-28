import type { Hex } from "viem";
import type { CdrReadProgress } from "./status.js";
import { CdrErrors } from "./errors.js";

/**
 * In-memory simulation of the whole CDR flow — including the ~15s `collecting-partials` read —
 * with zero chain/wallet/keeper. Use it for examples, tests, and Storybook (`mode: 'mock'`).
 * It reproduces the real status transitions + progress + typed errors so UI built against it
 * behaves identically against the live client.
 */
export interface MockOptions {
  /** Total simulated read time (ms). Default 3000 (fast); set higher to demo the wait UX. */
  readDelayMs?: number;
  /** Simulated validator threshold (number of progress ticks). Default 5. */
  threshold?: number;
}

export interface MockCdrKit {
  createVault(params?: { data?: Uint8Array }): Promise<{ uuid: number; txHash: Hex }>;
  writeVaultData(params: { uuid: number; dataKey: Uint8Array }): Promise<Hex>;
  accessVault(params: { uuid: number; onProgress?: (p: CdrReadProgress) => void }): Promise<Uint8Array>;
  subscribeAndAccess(params: {
    uuid: number;
    onProgress?: (step: "paying" | "collecting-partials" | "ready") => void;
  }): Promise<Uint8Array>;
}

const fakeTx = (): Hex => `0x${"ab".repeat(32)}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createMockCdrKit(opts: MockOptions = {}): MockCdrKit {
  const readDelayMs = opts.readDelayMs ?? 3000;
  const threshold = opts.threshold ?? 5;
  const store = new Map<number, Uint8Array>();
  let nextUuid = 9000;

  async function simulateRead(uuid: number, onProgress?: (p: CdrReadProgress) => void) {
    const step = readDelayMs / threshold;
    for (let i = 1; i <= threshold; i++) {
      await sleep(step);
      onProgress?.({ collected: i, threshold });
    }
    const data = store.get(uuid);
    if (!data) throw CdrErrors.vaultNotFound(uuid);
    return data;
  }

  return {
    async createVault(params) {
      const uuid = nextUuid++;
      if (params?.data) store.set(uuid, params.data);
      return { uuid, txHash: fakeTx() };
    },
    async writeVaultData({ uuid, dataKey }) {
      store.set(uuid, dataKey);
      return fakeTx();
    },
    async accessVault({ uuid, onProgress }) {
      return simulateRead(uuid, onProgress);
    },
    async subscribeAndAccess({ uuid, onProgress }) {
      onProgress?.("paying");
      await sleep(300);
      onProgress?.("collecting-partials");
      const data = await simulateRead(uuid);
      onProgress?.("ready");
      return data;
    },
  };
}
