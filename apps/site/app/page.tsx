import "./landing.css";

import { Hero } from "@/components/landing/hero";
import { PackageStrip } from "@/components/landing/package-strip";
import { Pillars } from "@/components/landing/pillars";
import { Quickstart } from "@/components/landing/quickstart";
import { AgentSection } from "@/components/landing/agent-section";
import { Conditions } from "@/components/landing/conditions";
import { McpSetup } from "@/components/landing/mcp-setup";
import { Proof } from "@/components/landing/proof";
import { Why } from "@/components/landing/why";
import { CtaBand } from "@/components/landing/cta-band";

export default function Home() {
  return (
    <>
      <Hero />
      <PackageStrip />
      <Pillars />
      <Quickstart />
      <AgentSection />
      <Conditions />
      <McpSetup />
      <Proof />
      <Why />
      <CtaBand />
    </>
  );
}
