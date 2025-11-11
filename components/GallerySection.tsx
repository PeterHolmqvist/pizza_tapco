"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { pizzeriaConfig } from "@/config/pizzeria.config";

export function GallerySection() {
  const { gallery, theme } = pizzeriaConfig;
  const [current, setCurrent] = useState<number | null>(null);

  if (!gallery || gallery.length === 0) return null;

  // ESC för att stänga
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCurrent(null);
      if (e.key === "ArrowRight" && current !== null)
        setCurrent((c) => (c! + 1) % gallery.length);
      if (e.key === "ArrowLeft" && current !== null)
        setCurrent((c) => (c! - 1 + gallery.length) % gallery.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [current, gallery.length]);

  return (
    <section id="gallery" className={`${theme.sectionBg} py-10`}>
      <div className="max-w-5xl mx-auto px-4">
        <h2 className={`${theme.h2} text-center mb-6`}>Galleri</h2>

        {/* grid */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {gallery.map((item, i) => (
            <div
              key={item.src}
              onClick={() => setCurrent(i)}
              className="relative w-full aspect-square overflow-hidden rounded-lg border border-slate-700/60 cursor-pointer"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="25vw"
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* modal */}
      {current !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setCurrent(null)}
        >
          <button
            className="absolute left-4 text-white text-2xl select-none"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((current - 1 + gallery.length) % gallery.length);
            }}
          >
            ‹
          </button>

          <div className="relative w-[90vw] h-[70vh] max-w-3xl">
            <Image
              src={gallery[current].src}
              alt={gallery[current].alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <button
            className="absolute right-4 text-white text-2xl select-none"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((current + 1) % gallery.length);
            }}
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}

