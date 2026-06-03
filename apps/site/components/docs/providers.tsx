"use client";

import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CdrConfigProvider } from "@cdr-kit/react";
import { AENEID_CHAIN_ID } from "@/lib/wagmi-config";

/**
 * Live CDR provider for docs demos. Reads wagmi from the surrounding SiteProviders.
 * No mock. When the visitor hasn't connected (or is on the wrong chain) we render
 * a frosted overlay with a Connect CTA; once they connect, the demo runs the real
 * on-chain flow against the configured vault.
 */
export function DocsLiveProvider({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useAccount();
  const onAeneid = chainId === AENEID_CHAIN_ID;

  return (
    <CdrConfigProvider>
      <div className="docs-live-wrap">
        {children}
        {(!isConnected || !onAeneid) && (
          <div className="docs-live-overlay" aria-live="polite">
            <div className="docs-live-card">
              <p className="docs-live-eyebrow">live · Aeneid testnet</p>
              <p className="docs-live-title">
                {!isConnected ? "Connect your wallet to interact." : "Switch to Aeneid testnet."}
              </p>
              <p className="docs-live-sub">
                Every demo runs the real subscribe → threshold-decrypt → reveal flow.
                Grab free testnet IP at{" "}
                <a href="https://aeneid.faucet.story.foundation/" target="_blank" rel="noreferrer">
                  the Aeneid faucet
                </a>
                .
              </p>
              <ConnectButton accountStatus="address" chainStatus="icon" />
            </div>
          </div>
        )}
      </div>
    </CdrConfigProvider>
  );
}

/**
 * @deprecated Mock providers are gone for 0.7.0. This alias keeps existing demo
 *   TSX files compiling during the T1-E migration window; once the migration is
 *   done the alias goes away and all callers must use DocsLiveProvider directly.
 */
export const DocsMockProvider = DocsLiveProvider;
