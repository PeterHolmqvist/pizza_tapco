"use client";

import { useCart } from "@/hooks/useCart";
import { pizzeriaConfig } from "@/config/pizzeria.config";
import { CheckoutModal } from "@/components/CheckoutModal";

export function CartBar() {
  const { total, totalCount, items, removeItem, clearCart } = useCart();
  const { theme } = pizzeriaConfig;

  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-md w-[90vw]">
      <div className="rounded-xl bg-black/80 border border-slate-700 px-4 py-3 text-xs sm:text-sm">
        <div className="flex justify-between items-center mb-2">
          <span className={theme.bodyText}>
            Varukorg: {totalCount} st · {total} kr
          </span>
          <button
            onClick={clearCart}
            className="text-[11px] underline text-slate-400 hover:text-slate-200"
          >
            Töm
          </button>
        </div>

        <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex justify-between items-center gap-2"
            >
              <span>
                {item.quantity}× {item.product.name}
              </span>
              <button
                onClick={() => removeItem(item.product.id)}
                className="text-[11px] text-red-400 hover:text-red-200"
              >
                −
              </button>
            </div>
          ))}
        </div>

        {/* Här använder vi modalen i stället för alert */}
        <CheckoutModal />
      </div>
    </div>
  );
}

