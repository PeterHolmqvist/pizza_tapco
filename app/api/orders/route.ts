import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { products } from "@/data/products";
import { getProductOptionGroups, optionCatalog } from "@/data/product-options";

type Size = "small" | "medium" | "large";
type IncomingItem = {
  productId: string;
  size: Size;
  quantity: number;
  selectedOptionIds?: string[];
  removedIngredients?: string[];
  specialInstructions?: string;
};

const catalog = products as unknown as Array<{
  id: string;
  name: string;
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
}>;

function isText(value: unknown, max = 300): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !secretKey) {
      return NextResponse.json({ error: "Order service is not configured." }, { status: 503 });
    }

    const body = await request.json();
    const customer = body?.customer;
    const items = body?.items as IncomingItem[];

    if (!customer || !isText(customer.name, 120) || !isText(customer.phone, 40)) {
      return NextResponse.json({ error: "Namn och telefonnummer krävs." }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length < 1 || items.length > 30) {
      return NextResponse.json({ error: "Ogiltig varukorg." }, { status: 400 });
    }

    const orderType = customer.mode === "delivery" ? "delivery" : customer.mode === "pickup" ? "pickup" : null;
    if (!orderType || (orderType === "delivery" && !isText(customer.address, 300))) {
      return NextResponse.json({ error: "Kontrollera leveransuppgifterna." }, { status: 400 });
    }

    const supabase = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", "tapco-pizza")
      .eq("is_active", true)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: "Restaurangen är inte konfigurerad ännu." }, { status: 503 });
    }

    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      if (!item || !isText(item.productId, 100) ||
          !["small", "medium", "large"].includes(item.size) ||
          !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
        return NextResponse.json({ error: "En eller flera varor är ogiltiga." }, { status: 400 });
      }

      const product = catalog.find((entry) => entry.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: "En produkt kunde inte hittas." }, { status: 400 });
      }

      const basePrice = item.size === "small" ? product.priceSmall
        : item.size === "medium" ? product.priceMedium : product.priceLarge;

      if (!Number.isFinite(basePrice) || basePrice < 0) {
        return NextResponse.json({ error: "Produkten saknar ett giltigt pris." }, { status: 400 });
      }

      const allowedOptions = getProductOptionGroups(product.id).flatMap((group) => group.options);
      const selectedIds = Array.isArray(item.selectedOptionIds) ? item.selectedOptionIds : [];
      if (selectedIds.length > 15 || selectedIds.some((id) => !allowedOptions.some((option) => option.id === id))) {
        return NextResponse.json({ error: "Ett eller flera tillval är ogiltiga." }, { status: 400 });
      }

      const selectedOptions = selectedIds.map((id) => {
        const option = optionCatalog.find((entry) => entry.id === id)!;
        return { id: option.id, name: option.name, price: option.price };
      });
      const unitPrice = basePrice + selectedOptions.reduce((sum, option) => sum + option.price, 0);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        restaurant_id: restaurant.id,
        product_id: null,
        product_name: product.name + " (" + item.size + ")",
        quantity: item.quantity,
        unit_price: unitPrice,
        selected_options: selectedOptions,
        removed_ingredients: Array.isArray(item.removedIngredients)
          ? item.removedIngredients.filter((value) => typeof value === "string").slice(0, 30)
          : [],
        special_instructions: isText(item.specialInstructions, 500) ? item.specialInstructions.trim() : null,
        line_total: lineTotal,
      });
    }

    const phone = customer.phone.trim();
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .eq("phone", phone)
      .maybeSingle();

    let customerId = existingCustomer?.id;
    if (!customerId) {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          restaurant_id: restaurant.id,
          name: customer.name.trim(),
          phone,
        })
        .select("id")
        .single();

      if (customerError || !newCustomer) {
        return NextResponse.json({ error: "Kunduppgifterna kunde inte sparas." }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    const orderNumber = "T" + Date.now().toString();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurant.id,
        customer_id: customerId,
        order_number: orderNumber,
        order_type: orderType,
        customer_name: customer.name.trim(),
        customer_phone: phone,
        delivery_address: orderType === "delivery" ? customer.address.trim() : null,
        special_instructions: isText(customer.note, 500) ? customer.note.trim() : null,
        subtotal,
        total: subtotal,
        currency: "SEK",
        status: "new",
        payment_status: "pending",
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Beställningen kunde inte sparas." }, { status: 500 });
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(validatedItems.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id).eq("restaurant_id", restaurant.id);
      return NextResponse.json({ error: "Beställningens innehåll kunde inte sparas." }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.order_number }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ett oväntat fel uppstod när beställningen skulle sparas." }, { status: 500 });
  }
}
