"use client";

import { pizzeriaConfig } from "@/config/pizzeria.config";

export function PressSection() {
  const { theme } = pizzeriaConfig;

  return (
    <section className={`${theme.sectionBg} py-10`}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className={`${theme.h2} mb-3`}>I media</h2>

        <div className="flex justify-center">
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <img
              src="/images/ekurriren.jpg"
              alt="Artikel i Eskilstuna-Kuriren om Tapco pizzeria"
              className="w-[340px] h-[400px] object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

