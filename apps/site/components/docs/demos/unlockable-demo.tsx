"use client";

import { UnlockablePill } from "@cdr-kit/react-ui";
import { DocsLiveProvider } from "../providers";

/** Live preview for `/docs/components/unlockable` — a realistic blog paragraph with three
 *  pills of different reveal types (text exhibit, image attachment, hidden prose). */
export function UnlockableDemo() {
  return (
    <DocsLiveProvider>
      <article className="unl-demo">
        <h3 className="unl-demo-title">Trouble at the Lake House</h3>
        <p className="unl-demo-byline">Arlo Vance · 6 min read</p>

        <p>
          Arlo Vance told the press he was alone in Tahoe to write. But{" "}
          <UnlockablePill uuid={4242} priceLabel="3 $IP" title="Exhibit 14B" subtitle="sheriff's report · attached">
            the woman beside him on the dock
          </UnlockablePill>{" "}
          disagrees — and the timeline in the official record doesn't add up.
        </p>

        <p>
          The first inconsistency was the photograph itself.{" "}
          <UnlockablePill uuid={4243} priceLabel="5 $IP" title="LAKESIDE-0741" subtitle="negative · 1 photo">
            One frame from the recovered roll
          </UnlockablePill>{" "}
          shows a side of the boat-house that no one ever admitted existed.
        </p>

        <p>
          What follows is the part the estate fought to suppress —{" "}
          <UnlockablePill uuid={4244} priceLabel="8 $IP" title="Closing chapter" subtitle="prose · 320 words">
            the closing chapter from Arlo's lost notebook
          </UnlockablePill>{" "}
          — written in his own hand the morning after.
        </p>
      </article>
    </DocsLiveProvider>
  );
}
