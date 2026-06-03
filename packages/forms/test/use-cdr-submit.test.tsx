import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCdrSubmit } from "../src/use-cdr-submit.js";

describe("useCdrSubmit", () => {
  it("starts idle with no vault and no error", () => {
    const { result } = renderHook(() =>
      useCdrSubmit({ onEncrypt: async () => 1 }),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.vaultId).toBeNull();
  });

  it("calls onEncrypt and records the returned vault id on success", async () => {
    const onEncrypt = vi.fn(async (fields: Record<string, unknown>) => {
      expect(fields).toEqual({ name: "Abu" });
      return 4242;
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCdrSubmit({ onEncrypt, onSuccess }));

    await act(async () => {
      await result.current.submit({ name: "Abu" });
    });

    expect(onEncrypt).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledWith(4242);
    expect(result.current.vaultId).toBe(4242);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("captures the error from onEncrypt and exposes it on error", async () => {
    const boom = new Error("bad");
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useCdrSubmit({
        onEncrypt: async () => {
          throw boom;
        },
        onError,
      }),
    );

    await act(async () => {
      try {
        await result.current.submit({});
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe(boom);
    expect(result.current.vaultId).toBeNull();
    expect(onError).toHaveBeenCalledWith(boom);
  });

  it("reset clears state back to idle", async () => {
    const { result } = renderHook(() => useCdrSubmit({ onEncrypt: async () => 9 }));
    await act(async () => {
      await result.current.submit({});
    });
    expect(result.current.vaultId).toBe(9);
    act(() => result.current.reset());
    expect(result.current.vaultId).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
