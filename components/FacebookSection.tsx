"use client";

import { pizzeriaConfig } from "@/config/pizzeria.config";

export function FacebookSection() {
  const { theme } = pizzeriaConfig;

  return (
    <section className={`${theme.sectionBg} py-10`}>
      <div className="max-w-4xl mx-auto px-4">
        <h2 className={`${theme.h2} mb-4 text-center`}>
          Följ oss på Facebook
        </h2>

        <div className="flex justify-center">
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <iframe
              src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fp%2FTapco-pizzeria-100086118158014%2F&tabs=timeline&width=340&height=400&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true"
              width="340"
              height="400"
              style={{ border: "none", overflow: "hidden" }}
              scrolling="no"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          </div>
        </div>
      </div>
    </section>
  );
}



