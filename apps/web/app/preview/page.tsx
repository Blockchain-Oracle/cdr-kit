"use client";

import type { ReactNode } from "react";
import { Store, PlusCircle, Boxes, Wallet } from "lucide-react";
import { Safe } from "@/components/preview/safe";
import GlassHero from "@/components/ui/glassmorphism-trust-hero";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import { PrismaHero } from "@/components/ui/prisma-hero";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { Spotlight } from "@/components/ui/spotlight-new";
import { AuroraBackground } from "@/components/ui/aurora-background";
import MatrixText from "@/components/kokonutui/matrix-text";
import { Component as VapourDemo } from "@/components/ui/vapour-text-effect";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";
import HyperText from "@/components/ui/hyper-text-with-decryption";
import { GlowCard } from "@/components/ui/spotlight-card";
import BentoGrid from "@/components/kokonutui/bento-grid";
import { LimelightNav } from "@/components/ui/limelight-nav";
import { Dock } from "@/components/ui/dock-two";
import { LogoCloud } from "@/components/ui/logo-cloud-2";
import TestimonialSection from "@/components/ui/testimonials";
import { Footer } from "@/components/blocks/footer-section";
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from "@/components/ui/code-block";

function Cat({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-indigo-600/30 to-black px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white backdrop-blur">
      {children}
    </div>
  );
}

const dockItems = [
  { icon: <Store className="h-5 w-5" />, label: "Marketplace", onClick: () => {} },
  { icon: <PlusCircle className="h-5 w-5" />, label: "Create", onClick: () => {} },
  { icon: <Boxes className="h-5 w-5" />, label: "Seller", onClick: () => {} },
  { icon: <Wallet className="h-5 w-5" />, label: "Buyer", onClick: () => {} },
];

export default function Preview() {
  return (
    <div className="bg-black">
      <Cat>Heroes</Cat>
      <Safe label="glassmorphism-trust-hero — 21st/easemize · teal-green + gold #ffcd75 + glass">
        <GlassHero />
      </Safe>
      <Safe label="cinematic-landing-hero — 21st/easemize · navy #050914 + blue/emerald + device">
        <CinematicHero
          brandName="cdr-kit"
          tagline1="Confidential data,"
          tagline2="made programmable."
          cardHeading="The Stripe layer for CDR."
          metricValue={5}
          metricLabel="Conditions live"
          ctaHeading="Ship gated data."
          ctaDescription="Private, paid, license-gated data on Story Protocol."
        />
      </Safe>
      <Safe label="prisma-hero — 21st/rahil1202 · cinematic video + cream #E1E0CC">
        <PrismaHero />
      </Safe>
      <Safe label="hero-highlight — @aceternity · dot grid + mouse spotlight + highlight">
        <HeroHighlight>
          <h1 className="mx-auto max-w-3xl px-4 text-center text-2xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
            Confidential data, <Highlight className="text-white">made programmable.</Highlight>
          </h1>
        </HeroHighlight>
      </Safe>
      <Safe label="spotlight-new — @aceternity · beam on near-black">
        <div className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden bg-black/[0.96]">
          <Spotlight />
          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
            <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
              Confidential data, <br /> made programmable.
            </h1>
          </div>
        </div>
      </Safe>
      <Safe label="aurora-background — @aceternity · zinc-900 + aurora gradient">
        <AuroraBackground className="!h-[70vh]">
          <h1 className="text-center text-3xl font-bold text-white md:text-5xl">Confidential data, made programmable.</h1>
        </AuroraBackground>
      </Safe>

      <Cat>Text effects</Cat>
      <Safe label="matrix-text — @kokonutui">
        <div className="flex min-h-[40vh] items-center justify-center bg-black">
          <MatrixText />
        </div>
      </Safe>
      <Safe label="vapour-text-effect — 21st/jatin-yadav05">
        <div className="min-h-[40vh] bg-black">
          <VapourDemo />
        </div>
      </Safe>
      <Safe label="particle-text-effect — 21st/Kain0127 (canvas)">
        <div className="min-h-[50vh] bg-black">
          <ParticleTextEffect words={["CONFIDENTIAL", "CDR-KIT", "DECRYPTED"]} />
        </div>
      </Safe>
      <Safe label="hyper-text-with-decryption — 21st/daiv09 (hover to scramble)">
        <div className="flex min-h-[30vh] items-center justify-center bg-black">
          <HyperText
            text="Confidential data made programmable"
            highlightWords={["Confidential", "programmable"]}
            className="max-w-3xl text-center text-2xl md:text-4xl"
          />
        </div>
      </Safe>

      <Cat>Backdrops / FX</Cat>
      <Safe label="spotlight-card — 21st/easemize (GlowCard)">
        <div className="flex min-h-[40vh] items-center justify-center bg-black p-10">
          <GlowCard className="flex h-64 w-80 items-center justify-center text-white">Spotlight card · hover me</GlowCard>
        </div>
      </Safe>

    </div>
  );
}
