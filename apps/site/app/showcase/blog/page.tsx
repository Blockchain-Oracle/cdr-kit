"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UnlockablePill } from "@cdr-kit/react-ui";
import { DocsMockProvider } from "@/components/docs/providers";
import "./blog.css";

const HINT_KEY = "cdr-blog-pill-hint-seen";

function FirstPillHint() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_KEY) === "1") return;
    } catch {
      return;
    }
    // Delay one frame so the page renders first, then animate in.
    const t = window.setTimeout(() => setVisible(true), 350);
    return () => window.clearTimeout(t);
  }, []);
  function dismiss() {
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
  }
  if (!visible) return null;
  return (
    <div className="blog-hint" role="status">
      <span className="blog-hint-arrow" aria-hidden="true" />
      <span className="blog-hint-text">
        <b>Highlights are pay-to-unlock.</b> Tap any amber phrase to reveal what&apos;s behind it.
      </span>
      <button type="button" className="blog-hint-dismiss" onClick={dismiss} aria-label="Dismiss hint">
        got it
      </button>
    </div>
  );
}

export default function ShowcaseBlogPage() {
  return (
    <DocsMockProvider>
      <article className="blog">
        <header className="blog-head">
          <Link href="/" className="blog-back">← cdr-kit</Link>
          <p className="blog-eyebrow">showcase · the &lt;UnlockablePill&gt; component</p>
          <h1 className="blog-title">Trouble at the Lake House</h1>
          <p className="blog-sub">A fictional essay built to demonstrate cdr-kit&apos;s inline paywall. Every amber pill is a real Story CDR vault.</p>
          <div className="blog-meta">
            <span className="blog-author">
              <span className="blog-avatar" aria-hidden="true" />
              Arlo Vance
            </span>
            <span className="blog-dot">·</span>
            <span>6 min read</span>
            <span className="blog-dot">·</span>
            <span>May 2026</span>
          </div>
        </header>

        <div className="blog-body">
          <FirstPillHint />
          <p className="blog-lede">
            For seventeen years, the only thing anyone agreed on was that Arlo Vance had been alone in the lake house the week his sister disappeared. He told the press he was writing. He told the sheriff he was writing. Both were true. But the page that ended up in the National Magazine archive was not the only page he wrote that week.
          </p>

          <p>
            The first night in Tahoe was warm. Arlo took a photograph from the deck — he&apos;d been alone, he said later, when the shutter clicked. He told the press he was alone in Tahoe to write. But{" "}
            <UnlockablePill uuid={4242} priceLabel="3 $IP" title="Exhibit 14B" subtitle="sheriff's report · attached">
              the woman beside him on the dock
            </UnlockablePill>{" "}
            disagrees — and the timeline in the official record doesn&apos;t add up.
          </p>

          <p>
            The next morning he developed the roll himself in the cellar. He kept two prints. One went to the local paper with the byline cropped out. The other, he said, he burned in the stove. Whether or not he&apos;d told the truth about the second print would not be decided for almost two decades.{" "}
            <UnlockablePill uuid={4243} priceLabel="5 $IP" title="LAKESIDE-0741" subtitle="negative · 1 photo · 4.4 MB">
              One frame from the recovered roll
            </UnlockablePill>{" "}
            shows a side of the boat-house that no one ever admitted existed.
          </p>

          <p>
            Mrs. Calder lived at the south end of the lake for fifty-one years. She kept everyone&apos;s film. She kept the negative of the frame Arlo claimed to have burned, and she kept it because Arlo paid her twenty dollars to do so the summer before the fire. She never said anything to the press. She told her granddaughter once, and her granddaughter told a podcaster fifteen years later, but by then Mrs. Calder was dead and the original negative had been donated, anonymously, to the county museum.
          </p>

          <p>
            What follows is the part the estate fought to suppress —{" "}
            <UnlockablePill uuid={4244} priceLabel="8 $IP" title="Closing chapter" subtitle="prose · 320 words · unpublished">
              the closing chapter from Arlo&apos;s lost notebook
            </UnlockablePill>{" "}
            — written in his own hand the morning after, the page he tore out before the typed manuscript reached the National Magazine&apos;s offices in New York. There is no copyright on a torn page. There is also no protection, until now.
          </p>

          <p>
            The point is not the secret. The point is that the secret is in the page, and the page is on the internet, and until you paid for it the page did not exist for you. It was real to the server. It was real to the validator network. It was not real to you. That is the whole proposition of Confidential Data Rails — and it is the difference between a watermark and a lock.
          </p>

          <div className="blog-cut">
            <span className="blog-cut-line" />
            <span className="blog-cut-label">end of preview</span>
            <span className="blog-cut-line" />
          </div>

          <p className="blog-cta">
            Built with <code>&lt;UnlockablePill&gt;</code> from{" "}
            <a href="https://www.npmjs.com/package/@cdr-kit/react-ui" target="_blank" rel="noreferrer">@cdr-kit/react-ui</a>{" "}
            · see the <Link href="/docs/components/unlockable">component docs</Link> · drop it into a Next.js or Vite app in two lines.
          </p>
        </div>
      </article>
    </DocsMockProvider>
  );
}
