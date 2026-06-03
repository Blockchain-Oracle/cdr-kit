"use client";
import { ProviderLogos } from "./provider-logos.js";

/** Stable id of a storage backend the form encrypts into. */
export type StorageProviderId = "pinata" | "storacha" | "supabase" | "ipfs" | "cdr";

export interface StorageProviderOption {
  id: StorageProviderId;
  label: string;
  /** Short subtitle rendered under the label. */
  description?: string;
}

/** The 5 storage backends shipped in 0.7.0. Consumers can pass a subset to {@link StorageProviderPicker}. */
export const DEFAULT_STORAGE_PROVIDERS: StorageProviderOption[] = [
  { id: "pinata", label: "Pinata", description: "IPFS pinning" },
  { id: "storacha", label: "Storacha", description: "web3.storage" },
  { id: "supabase", label: "Supabase", description: "Postgres + S3" },
  { id: "ipfs", label: "IPFS / Helia", description: "Self-hosted node" },
  { id: "cdr", label: "CDR Gateway", description: "Story-hosted" },
];

export interface StorageProviderPickerProps {
  /** Currently selected provider id. Pass `null` for "nothing selected". */
  value: StorageProviderId | null;
  /** Fires when the user clicks a tile. */
  onChange: (id: StorageProviderId) => void;
  /** Override the default list (e.g. to hide a backend your deployment doesn't support). */
  options?: StorageProviderOption[];
  /** Optional className appended to the grid root. */
  className?: string;
}

/**
 * Grid of storage-provider tiles with logos. Behaves like a single-select radio group;
 * `data-selected` is set on the active tile so consumers can style it.
 * @param value Currently selected provider id, or null.
 * @param onChange Fires with the provider id when the user picks a tile.
 * @param options Override the default 5-provider list.
 */
export function StorageProviderPicker({
  value,
  onChange,
  options = DEFAULT_STORAGE_PROVIDERS,
  className,
}: StorageProviderPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Storage provider"
      className={["cdr-forms-providers", className].filter(Boolean).join(" ")}
      data-cdr-forms-providers
    >
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-selected={selected || undefined}
            className="cdr-forms-provider"
            onClick={() => onChange(opt.id)}
          >
            <span className="cdr-forms-provider-logo">{ProviderLogos[opt.id]}</span>
            <span className="cdr-forms-provider-text">
              <span className="cdr-forms-provider-label">{opt.label}</span>
              {opt.description && <span className="cdr-forms-provider-desc">{opt.description}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
