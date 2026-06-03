import Link from "next/link";
import "./not-found.css";

/**
 * Custom 404 — cdr-kit design language. Renders a "vault not found" framing that
 * matches the rest of the site's voice (vaults, encryption, condition gates) and
 * gives the visitor 3 escape hatches: Docs · Quickstart · GitHub.
 *
 * Next.js App Router automatically renders this for any route the catch-all
 * `app/docs/[[...slug]]/page.tsx` calls `notFound()` on, plus any URL outside
 * the configured route tree.
 */
export const metadata = {
  title: "404 · vault not found — cdr-kit",
  description: "The page you were looking for isn't on cdrkit.xyz. Try the docs or quickstart.",
};

export default function NotFound() {
  return (
    <main className="nf">
      <div className="nf-grid" aria-hidden />
      <section className="nf-card">
        <p className="nf-eyebrow">
          <span className="nf-dot" /> error / 404
        </p>
        <h1 className="nf-title">
          vault <b>#404</b> not found.
        </h1>
        <p className="nf-sub">
          That route is not in the cdr-kit page tree. The CDR precompile would have
          returned <code>VaultNotFound</code> too, if it had a sense of humour.
        </p>

        <div className="nf-trace" aria-hidden>
          <code>
            <span className="nf-tok-com">// caller</span>
            <br />
            <span className="nf-tok-key">const</span>{" "}
            <span className="nf-tok-id">page</span>{" "}
            <span className="nf-tok-op">=</span>{" "}
            <span className="nf-tok-fn">getPage</span>(<span className="nf-tok-str">slug</span>);
            <br />
            <span className="nf-tok-key">if</span> (<span className="nf-tok-op">!</span>
            <span className="nf-tok-id">page</span>){" "}
            <span className="nf-tok-fn">notFound</span>();{" "}
            <span className="nf-tok-com">{`// ← you are here`}</span>
          </code>
        </div>

        <div className="nf-actions">
          <Link href="/docs" className="nf-btn nf-btn--primary">
            Go to docs
          </Link>
          <Link href="/docs/quickstart" className="nf-btn">
            Quickstart
          </Link>
          <a
            href="https://github.com/Blockchain-Oracle/cdr-kit/issues/new"
            target="_blank"
            rel="noreferrer"
            className="nf-btn"
          >
            Report this link
          </a>
        </div>

        <p className="nf-foot">
          Looking for something specific? Try ⌘K to search the docs.
        </p>
      </section>
    </main>
  );
}
