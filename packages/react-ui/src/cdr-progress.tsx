export interface CdrProgressProps {
  /** 0–100. Alternatively pass {collected, threshold} to derive. */
  value?: number;
  collected?: number;
  threshold?: number;
}

/** Determinate progress bar (gradient fill primary → signal). */
export function CdrProgress({ value, collected, threshold }: CdrProgressProps) {
  let pct: number;
  if (typeof value === "number") pct = clamp(value);
  else if (typeof collected === "number" && typeof threshold === "number" && threshold > 0) {
    pct = clamp((collected / threshold) * 100);
  } else {
    pct = 0;
  }
  return (
    <div className="cdr-ui-prog" data-cdr-ui="" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
