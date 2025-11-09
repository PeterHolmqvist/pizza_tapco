"use client";

import { pizzeriaConfig } from "@/config/pizzeria.config";
import { FaStar } from "react-icons/fa";

export function ReviewsSection() {
  const { reviews, googleReviewsUrl, theme } = pizzeriaConfig;

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className={`${theme.sectionBg} py-10`}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className={`${theme.h2} mb-4`}>Vad säger våra gäster?</h2>

        <div className="grid gap-4 md:grid-cols-3 text-left">
          {reviews.map((rev, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-700/60 p-3 text-xs sm:text-sm"
            >
              <div className="flex items-center gap-1 mb-1">
                {Array.from({ length: rev.rating }).map((_, idx) => (
                  <FaStar key={idx} className="text-yellow-400" size={12} />
                ))}
              </div>
              <p className={`${theme.bodyText} mb-2`}>“{rev.text}”</p>
              <p className="text-[11px] text-slate-400">— {rev.author}</p>
            </div>
          ))}
        </div>

        {googleReviewsUrl && (
          <a
            href={googleReviewsUrl}
            target="_blank"
            rel="noreferrer"
            className={`inline-block mt-6 px-4 py-2 rounded-full text-xs font-semibold ${theme.accentButton}`}
          >
            Se fler recensioner på Google
          </a>
        )}
      </div>
    </section>
  );
}


