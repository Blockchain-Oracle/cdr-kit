"use client";
import { useCallback, useState } from "react";
import type { CdrFormFields } from "./cdr-form.js";

export interface CdrSubmitOptions {
  /** Encrypt + store the submitted fields. Return the new vault id. */
  onEncrypt: (fields: CdrFormFields) => Promise<number>;
  /** Called after `onEncrypt` resolves; receives the new vault id. */
  onSuccess?: (vaultId: number) => void;
  /** Called when `onEncrypt` rejects. */
  onError?: (error: Error) => void;
}

export interface CdrSubmitResult {
  /** Run the encrypt call. Resolves to the vault id on success, throws on failure. */
  submit: (fields: CdrFormFields) => Promise<number>;
  /** True while `onEncrypt` is in flight. */
  isLoading: boolean;
  /** Most recent error from a failed submit, or null. */
  error: Error | null;
  /** Vault id of the most recent successful submit, or null. */
  vaultId: number | null;
  /** Clear vaultId + error so the form can accept another submission. */
  reset: () => void;
}

/**
 * Isomorphic submit hook for custom forms (i.e. when you can't or don't want to use {@link CdrForm}).
 * The `onEncrypt` callback is abstract — wire it to a server action, a fetch to /api, or a
 * client-side encrypt path.
 *
 * @param onEncrypt Encrypts the submitted fields and resolves to a vault id.
 * @returns `{ submit, isLoading, error, vaultId, reset }`.
 */
export function useCdrSubmit({ onEncrypt, onSuccess, onError }: CdrSubmitOptions): CdrSubmitResult {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [vaultId, setVaultId] = useState<number | null>(null);

  const submit = useCallback(
    async (fields: CdrFormFields) => {
      setLoading(true);
      setError(null);
      try {
        const id = await onEncrypt(fields);
        setVaultId(id);
        onSuccess?.(id);
        return id;
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        setError(wrapped);
        onError?.(wrapped);
        throw wrapped;
      } finally {
        setLoading(false);
      }
    },
    [onEncrypt, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setVaultId(null);
    setError(null);
  }, []);

  return { submit, isLoading, error, vaultId, reset };
}
