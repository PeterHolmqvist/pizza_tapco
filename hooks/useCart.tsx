"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Product } from "@/data/products";

type CartItem = {
  product: Product;
  quantity: number;
  removedIngredients?: string[];
  addedExtras?: string[];
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setItemCustomizations: (
    productId: string,
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

  function addItem(product: Product) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
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
    custom: {
      removedIngredients?: string[];
      addedExtras?: string[];
    }
  ) {
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, ...custom } : i
      )
    );
  }

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      ),
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

