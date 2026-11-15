// lib/order.ts
import type { Product } from "@/data/products";
import type { PizzaSize } from "@/hooks/useCart";

export type OrderItem = {
  productId: string;
  name: string;
  size: PizzaSize;
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
    size: PizzaSize;
    unitPrice: number;
    removedIngredients?: string[];
    addedExtras?: string[];
  }[],
  total: number,
  customer: OrderCustomer
): Order {
  const items: OrderItem[] = cartItems.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    size: item.size,
    price: item.unitPrice,
    quantity: item.quantity,
    removedIngredients: item.removedIngredients,
    addedExtras: item.addedExtras,
  }));

  return {
    id: Date.now().toString(36),
    items,
    total,
    customer,
    createdAt: new Date().toISOString(),
  };
}

export function orderToMessage(order: Order): string {
  const lineItems = order.items.map((item) => {
    const sizeLabel = item.size === "small" ? "S" : item.size === "medium" ? "M" : "L";
    const parts: string[] = [];
    if (item.removedIngredients?.length) parts.push("utan " + item.removedIngredients.join(", "));
    if (item.addedExtras?.length) parts.push("extra " + item.addedExtras.join(", "));
    const customText = parts.length ? " (" + parts.join("; ") + ")" : "";
    return item.quantity + "× " + item.name + " (" + sizeLabel + ")" + customText + " – " + item.price + " kr/st";
  }).join("\n");

  const modeText = order.customer.mode === "pickup"
    ? "Avhämtning."
    : "Hemleverans till: " + order.customer.address + ".";
  const note = order.customer.note ? " Kommentar: " + order.customer.note + "." : "";

  return "Hej! Jag vill beställa:\n" + lineItems + "\nTotalt " + order.total + " kr. " + modeText + " Namn: " + order.customer.name + ", Tel: " + order.customer.phone + "." + note;
}
