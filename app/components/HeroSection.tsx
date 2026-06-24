"use client";

import dynamic from "next/dynamic";

const HeroParticles = dynamic(() => import("./HeroParticles"), { ssr: false });

export default function HeroSection() {
  return <HeroParticles />;
}
