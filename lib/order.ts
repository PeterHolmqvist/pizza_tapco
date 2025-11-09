// lib/order.ts
import type { Product } from "@/data/products";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  removedIngredients?: string[];
  addedExtras?: string[];
};

export type OrderMode = "pickup" | "delivery";

export type OrderCustomer = {
  name: string;
  phone: string;
  address?: string;
  note?: string;
  mode: OrderMode;
};

export type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  customer: OrderCustomer;
  createdAt: string;
};

export function createOrderFromCart(
  cartItems: {
    product: Product;
    quantity: number;
    removedIngredients?: string[];
    addedExtras?: string[];
  }[],
  total: number,
  customer: OrderCustomer
): Order {
  const items: OrderItem[] = cartItems.map((i) => ({
    productId: i.product.id,
    name: i.product.name,
    price: i.product.price,
    quantity: i.quantity,
    removedIngredients: i.removedIngredients,
    addedExtras: i.addedExtras,
  }));

  const id = Date.now().toString(36);
  const createdAt = new Date().toISOString();

  return {
    id,
    items,
    total,
    customer,
    createdAt,
  };
}

export function orderToMessage(order: Order): string {
  const lineItems = order.items
    .map((i) => {
      const base = `${i.quantity}× ${i.name}`;
      const parts: string[] = [];

      if (i.removedIngredients?.length) {
        parts.push(`utan ${i.removedIngredients.join(", ")}`);
      }

      if (i.addedExtras?.length) {
        parts.push(`extra ${i.addedExtras.join(", ")}`);
      }

      if (!parts.length) return base;
      return `${base} (${parts.join("; ")})`;
    })
    .join(", ");

  const base = `Hej! Jag vill beställa: ${lineItems}. Totalt ${order.total} kr.`;

  const modeText =
    order.customer.mode === "pickup"
      ? "Avhämtning."
      : `Hemleverans till: ${order.customer.address}.`;

  const namePhone = `Namn: ${order.customer.name}, Tel: ${order.customer.phone}.`;

  const note = order.customer.note ? ` Kommentar: ${order.customer.note}.` : "";

  return `${base} ${modeText} ${namePhone}${note}`;
}
