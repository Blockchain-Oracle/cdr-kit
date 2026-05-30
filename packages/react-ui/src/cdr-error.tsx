import type { ReactNode } from "react";
import { AlertCircle } from "./icons";

export interface CdrErrorProps {
  title: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Soft-bordered error state with optional retry CTA. */
export function CdrError({ title, message, onRetry, retryLabel = "Retry" }: CdrErrorProps) {
  return (
    <div className="cdr-ui-error" role="alert" data-cdr-ui="">
      <AlertCircle className="ei" width={18} height={18} />
      <div className="et">
        <b>{title}</b>
        {message}
      </div>
      {onRetry && (
        <button type="button" className="retry" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
