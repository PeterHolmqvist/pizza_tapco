"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Product } from "@/data/products";

export type PizzaSize = "small" | "medium" | "large";

type CartItem = {
  product: Product;
  quantity: number;
  size: PizzaSize;
  unitPrice: number;
  removedIngredients?: string[];
  addedExtras?: string[];
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, size: PizzaSize, unitPrice: number) => void;
  removeItem: (productId: string, size: PizzaSize) => void;
  clearCart: () => void;
  setItemCustomizations: (
    productId: string,
    size: PizzaSize,
    custom: {
      removedIngredients?: string[];
      addedExtras?: string[];
    }
  ) => void;
  total: number;
  totalCount: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(product: Product, size: PizzaSize, unitPrice: number) {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product.id === product.id && i.size === size
      );
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1, size, unitPrice }];
    });
  }

  function removeItem(productId: string, size: PizzaSize) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.product.id === productId && i.size === size
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function clearCart() {
    setItems([]);
  }

  function setItemCustomizations(
    productId: string,
    size: PizzaSize,
    custom: {
      removedIngredients?: string[];
      addedExtras?: string[];
    }
  ) {
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.size === size ? { ...i, ...custom } : i
      )
    );
  }

  const total = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    clearCart,
    setItemCustomizations,
    total,
    totalCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart måste användas inuti CartProvider");
  }
  return ctx;
}


