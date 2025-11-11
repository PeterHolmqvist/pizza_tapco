"use client";

import { useState } from "react";
import { pizzeriaConfig } from "@/config/pizzeria.config";
import { products } from "@/data/products";
import { useCart } from "@/hooks/useCart";

type PizzaSize = "small" | "medium" | "large";

export function MenuSection() {
  const { theme } = pizzeriaConfig;
  const { addItem } = useCart();

  if (!products || products.length === 0) return null;

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, PizzaSize>>(
    {}
  );

  const visibleProducts = products.filter(
    (p) => p.category === activeCategory
  );

  function getPriceForSize(item: (typeof products)[number], size: PizzaSize) {
    if (size === "small") return item.priceSmall ?? item.price;
    if (size === "medium") return item.priceMedium ?? item.price;
    if (size === "large") return item.priceLarge ?? item.price;
    return item.price;
  }

  return (
    <section id="menu" className={`${theme.sectionBg} py-12`}>
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

        {/* Produkter */}
        <div className="space-y-2">
          {visibleProducts.map((item) => {
            const size: PizzaSize = selectedSizes[item.id] ?? "small";
            const priceForSize = getPriceForSize(item, size);

            return (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-3 border-b border-slate-700/60 py-2 text-sm ${theme.bodyText}`}
              >
                {/* Vänster kolumn – text */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{item.name}</div>

                  {item.ingredients?.length > 0 && (
                    <div className="text-xs text-slate-400">
                      {item.ingredients.join(", ")}
                    </div>
                  )}

                  {/* Beskrivning – bara på lite större skärmar för att inte göra raderna för höga på mobil */}
                  {item.description && (
                    <div className="text-[11px] text-slate-500 italic hidden sm:block">
                      {item.description}
                    </div>
                  )}

                  {/* Storleksval */}
                  <div className="mt-1 flex gap-1 text-[11px]">
                    {(["small", "medium", "large"] as PizzaSize[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setSelectedSizes((prev) => ({
                            ...prev,
                            [item.id]: s,
                          }))
                        }
                        className={`
                          px-2 py-0.5 rounded-full border
                          ${
                            size === s
                              ? "border-red-500 bg-red-500/10"
                              : "border-slate-600 text-slate-300"
                          }
                        `}
                      >
                        {s === "small" && "S"}
                        {s === "medium" && "M"}
                        {s === "large" && "L"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Höger kolumn – pris + knapp */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="font-semibold whitespace-nowrap">
                    {priceForSize} kr
                  </span>
                  <button
                    onClick={() => addItem(item, size, priceForSize)}
                    className={`text-xs px-3 py-1 rounded-full ${theme.accentButton}`}
                  >
                    Lägg till
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}







