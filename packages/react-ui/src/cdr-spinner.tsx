export interface CdrSpinnerProps {
  size?: number;
}

/** Indeterminate CSS spinner. */
export function CdrSpinner({ size = 18 }: CdrSpinnerProps) {
  return <span className="cdr-ui-spin" data-cdr-ui="" style={{ width: size, height: size }} />;
}
