import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@cdr-kit/react/styles.css";

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "cdr-kit — the developer toolkit for Story Confidential Data Rails",
  description:
    "Ship private, paid, license-gated data on Story Protocol. Condition contracts, a typed SDK, a React layer, and an autonomous agent kit — the wagmi/Stripe layer for CDR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${mono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@600&f[]=general-sans@400,500,600&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
