export interface IpPriceProps {
  /** Price in wei. Pass null for license-gated vaults. */
  wei: bigint | null;
  /** Period suffix appended after the IP value (e.g. " / 30d"). */
  period?: string;
  decimals?: number;
}

function formatIp(wei: bigint, decimals: number): string {
  const ONE = BigInt(10) ** BigInt(18);
  const whole = wei / ONE;
  const frac = wei % ONE;
  if (frac === BigInt(0)) return whole.toString();
  const fracStr = frac.toString().padStart(18, "0").slice(0, decimals);
  return `${whole.toString()}.${fracStr.replace(/0+$/, "") || "0"}`;
}

/** Formats wei as `<n> IP` with optional period suffix. License-gated vaults render the alt label. */
export function IpPrice({ wei, period, decimals = 4 }: IpPriceProps) {
  if (wei === null) {
    return <span className="cdr-ui-ip-price" data-cdr-ui="">License-gated</span>;
  }
  return (
    <span className="cdr-ui-ip-price" data-cdr-ui="">
      {formatIp(wei, decimals)} IP
      {period && <span className="per"> {period}</span>}
    </span>
  );
}
