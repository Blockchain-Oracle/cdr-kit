export interface CdrNetworkChipProps {
  mode: "live" | "mock";
  network?: string;
}

/** Pill with a glowing status dot indicating live / mock mode. */
export function CdrNetworkChip({ mode, network = "Aeneid" }: CdrNetworkChipProps) {
  return (
    <span className={["cdr-ui-netchip", mode].join(" ")} data-cdr-ui="">
      <span className="d" />
      {network} · {mode}
    </span>
  );
}
