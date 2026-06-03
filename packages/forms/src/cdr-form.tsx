"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FormEvent,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";

/** Public shape of values consumers pass through `onEncrypt`. */
export type CdrFormFields = Record<string, FormDataEntryValue>;

/** Encrypt callback — runs on submit. Return the new vault id (uint32 from CDR). */
export type CdrEncryptFn = (fields: CdrFormFields) => Promise<number>;

export interface CdrFormContextValue {
  /** True while `onEncrypt` is in flight. */
  isLoading: boolean;
  /** True once a submission succeeded; `vaultId` will be set. */
  isCompleted: boolean;
  /** Most recent error thrown by `onEncrypt`. */
  error: Error | null;
  /** The vault id returned by the most recent successful submission. */
  vaultId: number | null;
}

const CdrFormContext = createContext<CdrFormContextValue | null>(null);

/** Hook for {@link CdrSubmitButton} et al. — reads the parent form's submit state. */
export function useCdrFormContext(): CdrFormContextValue {
  const v = useContext(CdrFormContext);
  if (!v) throw new Error("@cdr-kit/forms: useCdrFormContext must be used inside <CdrForm>");
  return v;
}

export interface CdrFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "onError"> {
  /** Encrypt the submitted fields and return the new vault id. */
  onEncrypt: CdrEncryptFn;
  /** Called after `onEncrypt` resolves; receives the new vault id. */
  onSuccess?: (vaultId: number) => void;
  /** Called when `onEncrypt` rejects. */
  onError?: (error: Error) => void;
  children: ReactNode;
}

/**
 * Wraps a `<form>` and runs `onEncrypt(Object.fromEntries(FormData))` on submit.
 * Provides the loading/completed state to children via {@link useCdrFormContext}.
 * @param onEncrypt Encrypt + store the form payload; resolves to the new vault id.
 * @param onSuccess Called with the vault id after a successful submission.
 * @param onError Called with the thrown Error if `onEncrypt` rejects.
 */
export function CdrForm({
  onEncrypt,
  onSuccess,
  onError,
  children,
  className,
  ...rest
}: CdrFormProps) {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [vaultId, setVaultId] = useState<number | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isLoading) return;
      setLoading(true);
      setError(null);
      try {
        const fields = Object.fromEntries(new FormData(e.currentTarget));
        const id = await onEncrypt(fields);
        setVaultId(id);
        onSuccess?.(id);
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        setError(wrapped);
        onError?.(wrapped);
      } finally {
        setLoading(false);
      }
    },
    [isLoading, onEncrypt, onSuccess, onError],
  );

  const ctx = useMemo<CdrFormContextValue>(
    () => ({ isLoading, isCompleted: vaultId !== null, error, vaultId }),
    [isLoading, vaultId, error],
  );

  return (
    <CdrFormContext.Provider value={ctx}>
      <form
        {...rest}
        className={["cdr-forms-form", className].filter(Boolean).join(" ")}
        onSubmit={handleSubmit}
        data-cdr-form
        data-loading={isLoading || undefined}
        data-completed={vaultId !== null || undefined}
      >
        {children}
      </form>
    </CdrFormContext.Provider>
  );
}
