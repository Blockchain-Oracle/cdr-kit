export function Why() {
  return (
    <section className="section" id="why">
      <div className="container">
        <div className="sec-head reveal">
          <span className="eyebrow">
            <span className="tick">▚</span>Why cdr-kit
          </span>
          <h2 className="h-sec">Honest about the wedge.</h2>
        </div>
        <div className="why-grid">
          <article className="why-card card reveal">
            <div className="wk">vs. Lit / TACo</div>
            <h3>The Story IP coupling</h3>
            <p>
              CDR&apos;s threshold encryption is commodity. The edge is what it composes with — a read condition can
              require a license tier, a subscription, or a royalty payment, natively, on the same chain.
            </p>
          </article>
          <article className="why-card card reveal">
            <div className="wk">vs. Story&apos;s cdr-demo</div>
            <h3>Productization, not a demo</h3>
            <p>
              Story&apos;s reference ships ~9 app-internal demo contracts. cdr-kit turns them into a standard,
              installable, tested, typed library — and adds the advanced conditions (<code>Subscription</code>,{" "}
              <code>TierGate</code>, <code>Composable</code>) that exist nowhere else.
            </p>
          </article>
          <article className="why-card card reveal">
            <div className="wk">what it is not</div>
            <h3>A library, not a SaaS</h3>
            <p>
              No account, no hosted dashboard, no &ldquo;sign up.&rdquo; You install npm packages and own your stack.
              cdr-kit sits <em>on top of</em> Story Protocol and CDR — it doesn&apos;t replace them.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
