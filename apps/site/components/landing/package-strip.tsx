const PACKAGES = [
  "@cdr-kit/react",
  "@cdr-kit/react-ui",
  "@cdr-kit/core",
  "@cdr-kit/agent",
  "@cdr-kit/story",
  "@cdr-kit/tools",
  "@cdr-kit/mcp",
  "@cdr-kit/cli",
  "@cdr-kit/contracts",
  "@cdr-kit/vercel-ai",
  "@cdr-kit/openai",
  "@cdr-kit/langchain",
  "@cdr-kit/agentkit",
  "@cdr-kit/goat",
  "create-cdr-kit-app",
];

export function PackageStrip() {
  return (
    <section className="strip">
      <div className="container strip-inner">
        <span className="strip-label">@cdr-kit · 15 packages, v0.5</span>
        <div className="strip-pkgs">
          {PACKAGES.map((pkg) => (
            <a
              key={pkg}
              className="pkg-pill"
              href={`https://www.npmjs.com/package/${pkg}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {pkg}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
