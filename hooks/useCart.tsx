"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Product } from "@/data/products";
import type { ProductOption } from "@/data/product-options";

export type PizzaSize = "small" | "medium" | "large";

export type CartItem = {
  lineId: string;
  product: Product;
  quantity: number;
  size: PizzaSize;
  unitPrice: number;
  removedIngredients?: string[];
  addedExtras?: string[];
  selectedOptions?: ProductOption[];
  specialInstructions?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, size: PizzaSize, unitPrice: number, custom?: { removedIngredients?: string[]; selectedOptions?: ProductOption[]; specialInstructions?: string }) => void;
  removeItem: (productId: string, size: PizzaSize, lineId?: string) => void;
  clearCart: () => void;
  setItemCustomizations: (productId: string, size: PizzaSize, custom: { removedIngredients?: string[]; addedExtras?: string[] }, lineId?: string) => void;
  total: number;
  totalCount: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(product: Product, size: PizzaSize, unitPrice: number, custom: { removedIngredients?: string[]; selectedOptions?: ProductOption[]; specialInstructions?: string } = {}) {
    setItems((prev) => {
      const selectedOptions = custom.selectedOptions ?? [];
      const removedIngredients = custom.removedIngredients ?? [];
      const existing = prev.find((item) =>
        item.product.id === product.id &&
        item.size === size &&
        JSON.stringify(item.removedIngredients ?? []) === JSON.stringify(removedIngredients) &&
        JSON.stringify((item.selectedOptions ?? []).map((option) => option.id).sort()) === JSON.stringify(selectedOptions.map((option) => option.id).sort()) &&
        (item.specialInstructions ?? "") === (custom.specialInstructions ?? "")
      );

      if (existing) {
        return prev.map((item) => item.lineId === existing.lineId ? { ...item, quantity: item.quantity + 1 } : item);
      }

      return [...prev, {
        lineId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        product,
        quantity: 1,
        size,
        unitPrice,
        removedIngredients: removedIngredients.length ? removedIngredients : undefined,
        addedExtras: selectedOptions.map((option) => option.name),
        selectedOptions: selectedOptions.length ? selectedOptions : undefined,
        specialInstructions: custom.specialInstructions?.trim() || undefined,
      }];
    });
  }

  function removeItem(productId: string, size: PizzaSize, lineId?: string) {
    setItems((prev) => prev
      .map((item) => {
        const matches = lineId ? item.lineId === lineId : item.product.id === productId && item.size === size;
        return matches ? { ...item, quantity: item.quantity - 1 } : item;
      })
      .filter((item) => item.quantity > 0)
    );
  }

  function clearCart() {
    setItems([]);
  }

  function setItemCustomizations(productId: string, size: PizzaSize, custom: { removedIngredients?: string[]; addedExtras?: string[] }, lineId?: string) {
    setItems((prev) => prev.map((item) => {
      const matches = lineId ? item.lineId === lineId : item.product.id === productId && item.size === size;
      return matches ? { ...item, ...custom } : item;
    }));
  }

  const total = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);
  const totalCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, setItemCustomizations, total, totalCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart måste användas inuti CartProvider");
  return ctx;
}
