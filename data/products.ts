// data/products.ts

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  tags?: string[];
  ingredients?: string[];   // ← NYTT: standard-ingredienser
  extras?: string[];        // ← NYTT: möjliga extra-toppings
};


export const products: Product[] = [
  // Pizzor
  {
    id: "margherita",
    name: "Margherita",
    description: "Tomatsås, ost",
    price: 95,
    category: "Pizzor",
    ingredients: ["Tomatsås", "Ost"],
    extras: ["Extra ost", "Vitlök", "Feferoni"],
  },
  {
    id: "vesuvio",
    name: "Vesuvio",
    description: "Tomatsås, ost, skinka",
    price: 105,
    category: "Pizzor",
    ingredients: ["Tomatsås", "Ost", "Skinka"],
    extras: ["Extra ost", "Vitlök", "Feferoni"],
  },
  {
    id: "capricciosa",
    name: "Capricciosa",
    description: "Tomatsås, ost, skinka, champinjoner",
    price: 110,
    category: "Pizzor",
    ingredients: ["Tomatsås", "Ost", "Skinka", "Champinjoner"],
    extras: ["Extra ost", "Vitlök", "Feferoni"],
  },
  {
    id: "hawaii",
    name: "Hawaii",
    description: "Tomatsås, ost, skinka, ananas",
    price: 110,
    category: "Pizzor",
    ingredients: ["Tomatsås", "Ost", "Skinka", "Ananas"],
    extras: ["Extra ost", "Vitlök"],
  },

  // Specialpizzor
  {
    id: "napoli-special",
    name: "Napoli Special",
    description: "Mozzarella, parmaskinka, ruccola, parmesan",
    price: 135,
    category: "Specialpizzor",
    ingredients: ["Tomatsås", "Mozzarella", "Parmaskinka", "Ruccola", "Parmesan"],
    extras: ["Extra ost", "Vitlök"],
  },
  {
    id: "quattro-stagioni",
    name: "Quattro Stagioni",
    description: "Skinka, champinjoner, kronärtskocka, oliver",
    price: 130,
    category: "Specialpizzor",
    ingredients: ["Tomatsås", "Ost", "Skinka", "Champinjoner", "Kronärtskocka", "Oliver"],
    extras: ["Extra ost", "Vitlök", "Feferoni"],
  },
  {
    id: "diavola",
    name: "Diavola",
    description: "Stark salami, chili, lök",
    price: 130,
    category: "Specialpizzor",
    ingredients: ["Tomatsås", "Ost", "Stark salami", "Chili", "Lök"],
    extras: ["Extra ost", "Vitlök"],
  },

  // Barnpizzor
  {
    id: "barn-margherita",
    name: "Barn Margherita",
    description: "Mindre pizza med tomatsås och ost",
    price: 75,
    category: "Barnpizzor",
    ingredients: ["Tomatsås", "Ost"],
    extras: ["Extra ost"],
  },
  {
    id: "barn-vesuvio",
    name: "Barn Vesuvio",
    description: "Mindre pizza med skinka",
    price: 80,
    category: "Barnpizzor",
    ingredients: ["Tomatsås", "Ost", "Skinka"],
    extras: ["Extra ost"],
  },

  // Sallader
  {
    id: "grekisk-sallad",
    name: "Grekisk sallad",
    description: "Fetaost, oliver, tomat, gurka, lök",
    price: 110,
    category: "Sallader",
    ingredients: ["Fetaost", "Oliver", "Tomat", "Gurka", "Lök"],
  },
  {
    id: "kycklingsallad",
    name: "Kycklingsallad",
    description: "Kyckling, majs, gurka, tomat, dressing",
    price: 120,
    category: "Sallader",
    ingredients: ["Kyckling", "Majs", "Gurka", "Tomat", "Sallad", "Dressing"],
  },

  // Dryck
  {
    id: "cola-33",
    name: "Coca-Cola 33 cl",
    price: 25,
    category: "Dryck",
  },
  {
    id: "fanta-33",
    name: "Fanta 33 cl",
    price: 25,
    category: "Dryck",
  },
  {
    id: "vatten",
    name: "Mineralvatten",
    price: 20,
    category: "Dryck",
  },
];
