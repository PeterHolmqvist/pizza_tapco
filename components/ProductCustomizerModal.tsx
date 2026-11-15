"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { getProductOptionGroups, type ProductOption } from "@/data/product-options";
import type { PizzaSize } from "@/hooks/useCart";

type Props = {
  product: Product;
  size: PizzaSize;
  basePrice: number;
  onClose: () => void;
  onAdd: (price: number, custom: { removedIngredients?: string[]; selectedOptions?: ProductOption[] }) => void;
};

export function ProductCustomizerModal({ product, size, basePrice, onClose, onAdd }: Props) {
  const groups = getProductOptionGroups(product.id);
  const [removed, setRemoved] = useState<string[]>([]);
  const [selected, setSelected] = useState<ProductOption[]>([]);
  const total = useMemo(() => basePrice + selected.reduce((sum, option) => sum + option.price, 0), [basePrice, selected]);

  function toggleOption(option: ProductOption) {
    setSelected((current) => current.some((item) => item.id === option.id)
      ? current.filter((item) => item.id !== option.id)
      : [...current, option]);
  }

  function toggleIngredient(ingredient: string) {
    setRemoved((current) => current.includes(ingredient)
      ? current.filter((item) => item !== ingredient)
      : [...current, ingredient]);
  }

  const sizeLabel = size === "small" ? "S" : size === "medium" ? "M" : "L";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="customizer-title" className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="customizer-title" className="text-lg font-semibold">Anpassa {product.name}</h3>
            <p className="text-xs text-slate-400">Storlek {sizeLabel} · Grundpris {basePrice} kr</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Stäng" className="rounded-full px-2 py-1 text-slate-400 hover:bg-slate-800">✕</button>
        </div>

        {product.ingredients?.length ? (
          <section className="mt-5">
            <h4 className="mb-2 text-sm font-semibold">Ta bort ingredienser</h4>
            <div className="flex flex-wrap gap-2">
              {product.ingredients.map((ingredient) => (
                <button key={ingredient} type="button" onClick={() => toggleIngredient(ingredient)} className={`rounded-full border px-3 py-1.5 text-xs ${removed.includes(ingredient) ? "border-red-400 bg-red-500/15 text-red-200" : "border-slate-600 text-slate-200"}`}>
                  {removed.includes(ingredient) ? "− " : ""}{ingredient}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {groups.map((group) => (
          <section key={group.id} className="mt-5">
            <h4 className="mb-2 text-sm font-semibold">{group.name}</h4>
            <div className="space-y-2">
              {group.options.filter((option) => option.active).map((option) => {
                const checked = selected.some((item) => item.id === option.id);
                return (
                  <label key={option.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={checked} onChange={() => toggleOption(option)} className="accent-red-500" />
                      {option.name}
                    </span>
                    <span className="whitespace-nowrap text-slate-300">+{option.price} kr</span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        <div className="mt-5 flex items-center justify-between border-t border-slate-700 pt-4">
          <div>
            <p className="text-xs text-slate-400">Pris per pizza</p>
            <p className="text-xl font-bold">{total} kr</p>
          </div>
          <button type="button" onClick={() => onAdd(total, { removedIngredients: removed.length ? removed : undefined, selectedOptions: selected.length ? selected : undefined })} className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
            Lägg i varukorg
          </button>
        </div>
      </div>
    </div>
  );
}
