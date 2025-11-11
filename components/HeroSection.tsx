"use client";

import { useState } from "react";
import Image from "next/image";
import { pizzeriaConfig } from "@/config/pizzeria.config";

export function HeroSection() {
  const { name, tagline, phone, theme, heroImage, logo } = pizzeriaConfig;
  const [showNumber, setShowNumber] = useState(false);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center text-center px-4 overflow-hidden">
      {/* Bakgrundsbild */}
      {heroImage && (
        <Image
          src={heroImage}
          alt={`${name} bakgrund`}
          fill
          priority
          sizes="100vw"
          className="object-cover scale-100"
        />
      )}

      {/* Mörk overlay */}
      {/* Mörk overlay */}
<div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />

      {/* Innehåll */}
      <div className="relative z-10 flex flex-col items-center">
        {logo && (
          <Image
            src={logo}
            alt={`${name} logo`}
            width={300}
            height={180}
            className="mb-4 w-32 h-32 md:w-40 md:h-40 shadow-lg"
          />
        )}

        <h1 className={theme.h1}>{name}</h1>
        <p className={`mt-2 ${theme.bodyText}`}>{tagline}</p>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        {showNumber && (
          <div className="mb-2 rounded-full bg-black/80 px-4 py-2 text-xs sm:text-sm flex items-center gap-3">
            <span>{phone}</span>
            <a
              href={`tel:${phone}`}
              className="underline font-semibold"
            >
              Ring nu
            </a>
          </div>
        )}

        <button
          onClick={() => setShowNumber((v) => !v)}
          className={`
            px-6 py-3 rounded-full font-semibold shadow-lg
            ${theme.accentButton}
          `}
        >
          {showNumber ? "Dölj nummer" : "Ring & beställ"}
        </button>
      </div>
    </section>
  );
}






