"use client";

import { useState } from "react";
import { StorageProviderPicker, type StorageProviderId } from "@cdr-kit/forms";
import "@cdr-kit/forms/styles.css";

/** Standalone preview for /docs/components/storage-provider-picker. */
export function StorageProviderPickerDemo() {
  const [provider, setProvider] = useState<StorageProviderId>("pinata");
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <StorageProviderPicker value={provider} onChange={setProvider} />
    </div>
  );
}
