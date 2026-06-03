"use client";

import { useState } from "react";
import { CdrError } from "@cdr-kit/react-ui";

/**
 * Client-side demo for {@link CdrError}. The retry button needs a real onRetry
 * handler — the catch-all docs route is a Server Component, so the handler
 * can't be serialized inline in MDX. Wrapping it in this "use client" demo
 * lets the button actually click without RSC-serialization errors.
 */
export function CdrErrorDemo() {
  const [retries, setRetries] = useState(0);
  return (
    <CdrError
      title="Read timed out"
      message={
        retries === 0
          ? "Threshold not met in time."
          : `Threshold not met in time. (retried ${retries}×)`
      }
      onRetry={() => setRetries((n) => n + 1)}
    />
  );
}
