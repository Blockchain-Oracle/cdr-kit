"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useCdrFormContext } from "./cdr-form.js";

export interface CdrSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Default idle label. */
  children?: ReactNode;
  /** Label shown while the encrypt call is in flight. */
  loadingLabel?: ReactNode;
  /** Label shown after a successful submission. */
  completedLabel?: ReactNode;
}

/**
 * Submit button bound to the parent {@link CdrForm} state.
 * Renders `loadingLabel` while encrypting, `completedLabel` after success,
 * and `children` (default "Submit securely") at rest.
 */
export function CdrSubmitButton({
  children = "Submit securely",
  loadingLabel = "Encrypting…",
  completedLabel = "Submitted ✓",
  className,
  disabled,
  ...rest
}: CdrSubmitButtonProps) {
  const { isLoading, isCompleted } = useCdrFormContext();
  const label = isCompleted ? completedLabel : isLoading ? loadingLabel : children;
  return (
    <button
      type="submit"
      {...rest}
      className={["cdr-forms-submit", className].filter(Boolean).join(" ")}
      disabled={disabled || isLoading || isCompleted}
      data-loading={isLoading || undefined}
      data-completed={isCompleted || undefined}
    >
      {label}
    </button>
  );
}
