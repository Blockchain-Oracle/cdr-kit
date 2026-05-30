import { DocPage } from "@/components/docs/doc-page";

const APPEARANCE_CODE = `<CdrProvider
  appearance={{
    variables: {
      "--cdr-accent": "#3E3BE3",
      "--cdr-border": "#E6E2DA",
      "--cdr-skeleton": "#EDEAE2",
    },
  }}
  // ...
>`;

export default function ThemingPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Getting started", "Theming"],
        title: "Theming",
        lede: (
          <>
            <code>@cdr-kit/react</code> is intentionally headless. The components ship minimal default visuals; you theme
            the look through CSS custom properties passed via <code>CdrProvider.appearance.variables</code> (or by setting
            them on a parent stylesheet).
          </>
        ),
        sections: [
          {
            id: "tokens",
            title: "Recognized tokens",
            content: (
              <ul>
                <li><code>--cdr-accent</code> — primary accent</li>
                <li><code>--cdr-border</code> — hairline border color</li>
                <li><code>--cdr-skeleton</code> — placeholder background</li>
                <li><code>--cdr-fg</code>, <code>--cdr-muted</code> — text colors</li>
              </ul>
            ),
          },
          {
            id: "passing",
            title: "Passing tokens",
            content: (
              <div className="win doc-code">
                <div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">App.tsx</span></div>
                <div className="code"><pre><code>{APPEARANCE_CODE}</code></pre></div>
              </div>
            ),
          },
          {
            id: "styled",
            title: "Styled variants",
            content: (
              <p>
                Want batteries-included pre-styled components instead of headless slots? See{" "}
                <code>@cdr-kit/react-ui</code> in the component gallery.
              </p>
            ),
          },
        ],
        prev: { href: "/docs/quickstart", label: "Quickstart" },
        next: { href: "/docs/components/cdr-provider", label: "CdrProvider" },
      }}
    />
  );
}
