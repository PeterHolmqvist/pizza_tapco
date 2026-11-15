import type { Product } from "@/data/products";

export type OptionGroupType =
  | "extra-ingredients"
  | "sauces"
  | "sides"
  | "drinks";

export type ProductOption = {
  id: string;
  name: string;
  price: number;
  type: OptionGroupType;
  active: boolean;
};

export type ProductOptionGroup = {
  id: string;
  name: string;
  type: OptionGroupType;
  minSelections: number;
  maxSelections: number;
  options: ProductOption[];
};

export type ProductOptionConfig = {
  productId: Product["id"];
  groups: ProductOptionGroup[];
};

// Demo catalog. Prices and product compatibility must be confirmed by the restaurant.
export const optionCatalog: ProductOption[] = [
  { id: "extra-cheese", name: "Extra ost", price: 10, type: "extra-ingredients", active: true },
  { id: "shrimp", name: "Räkor", price: 25, type: "extra-ingredients", active: true },
  { id: "bacon", name: "Bacon", price: 15, type: "extra-ingredients", active: true },
  { id: "mushrooms", name: "Champinjoner", price: 10, type: "extra-ingredients", active: true },
  { id: "bearnaise", name: "Bearnaisesås", price: 15, type: "sauces", active: true },
  { id: "garlic-sauce", name: "Vitlökssås", price: 15, type: "sauces", active: true },
  { id: "pizza-salad", name: "Pizzasallad", price: 15, type: "sides", active: true },
  { id: "soft-drink", name: "Läsk", price: 25, type: "drinks", active: true },
];

// Product-specific groups control which extras are offered for each pizza.
const extraIngredientsByProduct: Record<string, string[]> = {
  margarita: ["extra-cheese", "shrimp", "mushrooms", "bacon"],
  vesuvio: ["extra-cheese", "shrimp", "mushrooms", "bacon"],
  capricciosa: ["extra-cheese", "shrimp", "mushrooms", "bacon"],
  hawaii: ["extra-cheese", "shrimp", "mushrooms", "bacon"],
  vegetariana: ["extra-cheese", "mushrooms"],
  kebabpizza: ["extra-cheese", "bacon", "mushrooms"],
};

const sharedGroups: ProductOptionGroup[] = [
  {
    id: "sauces",
    name: "Såser",
    type: "sauces",
    minSelections: 0,
    maxSelections: 5,
    options: optionCatalog.filter((option) => option.type === "sauces"),
  },
  {
    id: "sides",
    name: "Tillbehör",
    type: "sides",
    minSelections: 0,
    maxSelections: 5,
    options: optionCatalog.filter((option) => option.type === "sides"),
  },
  {
    id: "drinks",
    name: "Dryck",
    type: "drinks",
    minSelections: 0,
    maxSelections: 5,
    options: optionCatalog.filter((option) => option.type === "drinks"),
  },
];

export function getProductOptionGroups(productId: string): ProductOptionGroup[] {
  const allowedIds = extraIngredientsByProduct[productId] ?? [];
  const extraGroup: ProductOptionGroup = {
    id: "extra-ingredients",
    name: "Extra ingredienser",
    type: "extra-ingredients",
    minSelections: 0,
    maxSelections: 10,
    options: optionCatalog.filter(
      (option) => option.type === "extra-ingredients" && allowedIds.includes(option.id),
    ),
  };

  return [
    ...(extraGroup.options.length > 0 ? [extraGroup] : []),
    ...sharedGroups,
  ];
}
