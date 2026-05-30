import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/lib/fonts";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import "./globals.css";
import "@cdr-kit/react-ui/styles.css";

export const metadata: Metadata = {
  title: "cdr-kit — ship private, paid, license-gated data on Story",
  description:
    "The developer toolkit for Story Protocol's Confidential Data Rails. Gate encrypted data behind a real on-chain payment or license check in under a minute.",
};

/** Inline init script: read the persisted theme and set `data-theme` BEFORE first paint to avoid
 *  the FOUC of a light-themed flash on a dark-mode-preferring user. Mirrors the bundle's pattern. */
const THEME_INIT = `try{var t=localStorage.getItem('cdr-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <Reveal />
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
