"use client";

import { pizzeriaConfig } from "@/config/pizzeria.config";
import { FaStar } from "react-icons/fa";

export function ReviewsSection() {
  const {
    reviews,
    googleReviewsUrl,
    foodoraUrl,
    ratings,
    theme,
  } = pizzeriaConfig as any;

  if (!reviews || reviews.length === 0) return null;

  return (
    <section id="reviews" className={`${theme.sectionBg} py-10`}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className={`${theme.h2} mb-2`}>Vad säger våra gäster?</h2>

        {/* Badges för Google / Foodora-betyg */}
        <div className="mb-6 flex flex-wrap justify-center gap-3 text-xs sm:text-sm">
          {ratings?.google && (
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1"
            >
              <FaStar className="text-yellow-400" size={12} />
              <span className="font-semibold">
                {ratings.google.toFixed(1)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-slate-300">
                Google
              </span>
              {ratings.googleReviewsCount && (
                <span className="text-[10px] text-slate-400">
                  ({ratings.googleReviewsCount}+)
                </span>
              )}
            </a>
          )}

          {ratings?.foodora && (
            <a
              href={foodoraUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1"
            >
              <FaStar className="text-yellow-400" size={12} />
              <span className="font-semibold">
                {ratings.foodora.toFixed(1)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-slate-300">
                Foodora
              </span>
              {ratings.foodoraReviewsCount && (
                <span className="text-[10px] text-slate-400">
                  ({ratings.foodoraReviewsCount}+)
                </span>
              )}
            </a>
          )}
        </div>

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



