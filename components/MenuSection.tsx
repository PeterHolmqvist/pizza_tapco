"use client";

import { useState } from "react";
import { pizzeriaConfig } from "@/config/pizzeria.config";
import { products } from "@/data/products";
import { useCart } from "@/hooks/useCart";

export function MenuSection() {
  const { theme } = pizzeriaConfig;
  const { addItem } = useCart();

  if (!products || products.length === 0) return null;

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);

  const visibleProducts = products.filter(
    (p) => p.category === activeCategory
  );

  return (
    <section className={`${theme.sectionBg} py-12`}>
      <div className="max-w-4xl mx-auto px-4">
        <h2 className={`${theme.h2} text-center mb-6`}>Meny</h2>

        {/* Kategorier (tabs) */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`
                px-3 py-1 rounded-full text-xs sm:text-sm border transition
                ${
                  category === activeCategory
                    ? theme.menuTabActive
                    : theme.menuTabInactive
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Produkter i aktuell kategori */}
        <div className="space-y-2">
          {visibleProducts.map((item) => (
            <div
              key={item.id}
              className={`flex justify-between items-center border-b border-slate-700/60 py-2 text-sm ${theme.bodyText}`}
            >
              <div>
                <div className="font-semibold">{item.name}</div>

                {item.ingredients && item.ingredients.length > 0 && (
                  <div className="text-xs text-slate-400">
                    {item.ingredients.join(", ")}
                  </div>
                )}

                {item.description && (
                  <div className="text-[11px] text-slate-500 italic">
                    {item.description}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold whitespace-nowrap">
                  {item.price} kr
                </span>
                <button
                  onClick={() => addItem(item)}
                  className={`text-xs px-3 py-1 rounded-full ${theme.accentButton}`}
                >
                  Lägg till
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}




