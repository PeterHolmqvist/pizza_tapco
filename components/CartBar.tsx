"use client";

import { useCart } from "@/hooks/useCart";
import { pizzeriaConfig } from "@/config/pizzeria.config";
import { CheckoutModal } from "@/components/CheckoutModal";
import { ProductCustomizerModal } from "@/components/ProductCustomizerModal";
import { useState } from "react";

export function CartBar() {
  const { total, totalCount, items, removeItem, updateItem, clearCart } = useCart();
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const editingItem = items.find((item) => item.lineId === editingLineId) ?? null;
  const { theme } = pizzeriaConfig;

  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[92vw] max-w-md -translate-x-1/2">
      <div className="rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur">
        <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <p className="text-sm font-semibold text-white">Din beställning</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {totalCount} {totalCount === 1 ? "vara" : "varor"} i varukorgen
            </p>
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-slate-400 underline underline-offset-2 transition hover:text-white"
          >
            Töm varukorg
          </button>
        </div>

        <div className="mb-3 max-h-36 space-y-3 overflow-y-auto pr-1">
          {items.map((item) => {
            const sizeLabel =
              item.size === "small" ? "S" : item.size === "medium" ? "M" : "L";
            const lineTotal = item.unitPrice * item.quantity;

            return (
              <div
                key={item.lineId}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-100">
                    {item.quantity} × {item.product.name}
                    <span className="ml-1 font-normal text-slate-400">({sizeLabel})</span>
                  </p>
                  {item.removedIngredients?.length ? (
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Utan {item.removedIngredients.join(", ")}
                    </p>
                  ) : null}
                  {item.addedExtras?.length ? (
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Extra: {item.addedExtras.join(", ")}
                    </p>
                  ) : null}
                  {item.specialInstructions ? (
                    <p className="mt-0.5 text-[10px] text-amber-300">
                      Önskemål: {item.specialInstructions}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-slate-500">
                    {item.unitPrice} kr/st
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums text-slate-200">
                    {lineTotal} kr
                  </span>
                  <button type="button" onClick={() => setEditingLineId(item.lineId)} className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300">Ändra</button>
                  <button
                    type="button"
                    aria-label={`Ta bort en ${item.product.name}`}
                    onClick={() => removeItem(item.product.id, item.size, item.lineId)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 text-sm text-slate-400 transition hover:border-red-400 hover:text-red-300"
                  >
                    −
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-3 flex items-end justify-between border-t border-slate-800 pt-3">
          <span className="text-xs font-medium text-slate-300">Att betala</span>
          <span className="text-2xl font-bold leading-none tabular-nums text-white">
            {total} <span className="text-sm font-semibold text-slate-300">kr</span>
          </span>
        </div>

        <CheckoutModal />
      </div>
      {editingItem ? (
        <ProductCustomizerModal
          key={editingItem.lineId}
          product={editingItem.product}
          size={editingItem.size}
          basePrice={editingItem.unitPrice - (editingItem.selectedOptions ?? []).reduce((sum, option) => sum + option.price, 0)}
          initialRemoved={editingItem.removedIngredients}
          initialSelectedOptions={editingItem.selectedOptions}
          initialSpecialInstructions={editingItem.specialInstructions}
          actionLabel="Spara ändringar"
          onClose={() => setEditingLineId(null)}
          onAdd={(price, custom) => {
            updateItem(editingItem.lineId, price, custom);
            setEditingLineId(null);
          }}
        />
      ) : null}
    </div>
  );
}
