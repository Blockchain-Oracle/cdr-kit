import type { CdrError } from "./errors.js";

/** First-class status for CDR flows — the ~15s read is a real phase, never a bare spinner. */
export type CdrStatus =
  | "idle"
  | "connecting"
  | "paying"
  | "collecting-partials"
  | "ready"
  | "error"
  | "empty";

export interface CdrReadProgress {
  collected: number;
  threshold: number;
}

export interface CdrState<T> {
  status: CdrStatus;
  data?: T;
  error?: CdrError;
  /** Determinate progress during `collecting-partials` (drive a progress bar, not a spinner). */
  progress?: CdrReadProgress;
}

type Handlers<T, R> = Partial<Record<CdrStatus, (state: CdrState<T>) => R>> & {
  _?: (state: CdrState<T>) => R;
};

/** Pattern-match over a CdrState; `_` is the fallback. Keeps UI code free of status if-ladders. */
export function matchCdrStatus<T, R>(state: CdrState<T>, handlers: Handlers<T, R>): R | undefined {
  const handler = handlers[state.status] ?? handlers._;
  return handler ? handler(state) : undefined;
}
