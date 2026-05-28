import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const getLogs = vi.fn().mockResolvedValue([
  { args: { tokenId: 1n, uuid: 9001, ipId: "0xip1", creator: "0xc1" } },
  { args: { tokenId: 2n, uuid: 9002, ipId: "0xip2", creator: "0xc2" } },
]);
const getBlockNumber = vi.fn().mockResolvedValue(1000n);
// Stable reference — real wagmi memoizes usePublicClient; a fresh object each render
// would re-fire the client-keyed effect every render.
const mockClient = { getLogs, getBlockNumber };

vi.mock("wagmi", () => ({
  usePublicClient: () => mockClient,
}));

import { useDiscoverVaults } from "../src/use-discover-vaults.js";

describe("useDiscoverVaults", () => {
  it("loads historical VaultCreated logs", async () => {
    const { result } = renderHook(() => useDiscoverVaults());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.vaults.length).toBe(2);
    expect(result.current.vaults[0].uuid).toBe(9001);
    expect(result.current.vaults[1].creator).toBe("0xc2");
  });
});
