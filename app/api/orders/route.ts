import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Size = "small" | "medium" | "large";
type IncomingItem = {
  productId: string;
  size: Size;
  quantity: number;
  selectedOptionIds?: string[];
  removedIngredients?: string[];
  specialInstructions?: string;
};

function isText(value: unknown, max = 300): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !secretKey) {
      console.error("[orders] Missing Supabase environment variable", {
        hasUrl: Boolean(url),
        hasSecretKey: Boolean(secretKey),
      });
      return NextResponse.json({ error: "Order service is not configured." }, { status: 503 });
    }

    const body = await request.json();
    const customer = body?.customer;
    const items = body?.items as IncomingItem[];
    const paymentMethod = body?.paymentMethod === "online" ? "online" : body?.paymentMethod === "in_store" || body?.paymentMethod == null ? "in_store" : null;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!paymentMethod) {
      return NextResponse.json({ error: "Välj ett giltigt betalningssätt." }, { status: 400 });
    }
    if (paymentMethod === "online" && !stripeSecretKey) {
      return NextResponse.json({ error: "Onlinebetalning är inte konfigurerad." }, { status: 503 });
    }

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
      console.error("[orders] Restaurant lookup failed", {
        code: restaurantError?.code,
        message: restaurantError?.message,
        details: restaurantError?.details,
        hint: restaurantError?.hint,
        hasRestaurant: Boolean(restaurant),
        supabaseHost: (() => {
          try { return new URL(url).host; } catch { return "invalid-url"; }
        })(),
        secretKeyFormat: secretKey.startsWith("sb_secret_") ? "sb_secret" : secretKey.startsWith("eyJ") ? "legacy-jwt" : "other",
      });
      return NextResponse.json({ error: "Restaurangen är inte konfigurerad ännu." }, { status: 503 });
    }

    const catalogKeys = [...new Set(items.map((item) => item?.productId).filter((id): id is string => typeof id === "string"))];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id,catalog_key,name,price_small,price_medium,price_large,ingredients,is_available")
      .eq("restaurant_id", restaurant.id)
      .eq("is_available", true)
      .in("catalog_key", catalogKeys);

    if (productsError || !products) {
      return NextResponse.json({ error: "Menyn kunde inte läsas." }, { status: 503 });
    }

    const productIds = products.map((product) => product.id);
    const { data: links, error: linksError } = await supabase
      .from("product_option_links")
      .select("product_id,product_options(id,option_key,name,price,option_type,is_active)")
      .eq("restaurant_id", restaurant.id)
      .in("product_id", productIds);

    if (linksError) {
      return NextResponse.json({ error: "Produktens tillval kunde inte läsas." }, { status: 503 });
    }

    const allowedByProduct = new Map<string, Map<string, { id: string; name: string; price: number }>>();
    for (const link of links ?? []) {
      const option = Array.isArray(link.product_options) ? link.product_options[0] : link.product_options;
      if (!option || !option.is_active || !option.option_key) continue;
      const map = allowedByProduct.get(link.product_id) ?? new Map();
      map.set(option.option_key, { id: option.option_key, name: option.name, price: Number(option.price) });
      allowedByProduct.set(link.product_id, map);
    }

    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      if (!item || !isText(item.productId, 100) ||
          !["small", "medium", "large"].includes(item.size) ||
          !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
        return NextResponse.json({ error: "En eller flera varor är ogiltiga." }, { status: 400 });
      }

      const product = products.find((entry) => entry.catalog_key === item.productId);
      if (!product) {
        return NextResponse.json({ error: "En produkt är inte längre tillgänglig." }, { status: 400 });
      }

      const basePrice = item.size === "small" ? Number(product.price_small)
        : item.size === "medium" ? Number(product.price_medium) : Number(product.price_large);

      if (!Number.isFinite(basePrice) || basePrice < 0) {
        return NextResponse.json({ error: "Produkten saknar ett giltigt pris." }, { status: 400 });
      }

      const allowedOptions = allowedByProduct.get(product.id) ?? new Map();
      const selectedIds = Array.isArray(item.selectedOptionIds) ? item.selectedOptionIds : [];
      if (selectedIds.length > 15 || new Set(selectedIds).size !== selectedIds.length ||
          selectedIds.some((id) => !allowedOptions.has(id))) {
        return NextResponse.json({ error: "Ett eller flera tillval är ogiltiga." }, { status: 400 });
      }

      const selectedOptions = selectedIds.map((id) => allowedOptions.get(id)!);
      const unitPrice = basePrice + selectedOptions.reduce((sum, option) => sum + option.price, 0);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      const ingredients = Array.isArray(product.ingredients) ? product.ingredients : [];
      const removed = Array.isArray(item.removedIngredients)
        ? item.removedIngredients.filter((value) => typeof value === "string" && ingredients.includes(value)).slice(0, 30)
        : [];

      validatedItems.push({
        restaurant_id: restaurant.id,
        product_id: product.id,
        product_name: product.name + " (" + item.size + ")",
        quantity: item.quantity,
        unit_price: unitPrice,
        selected_options: selectedOptions,
        removed_ingredients: removed,
        special_instructions: isText(item.specialInstructions, 500) ? item.specialInstructions.trim() : null,
        line_total: lineTotal,
      });
    }

    const phone = customer.phone.trim();
    const { data: existingCustomer, error: customerLookupError } = await supabase
      .from("customers")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .eq("phone", phone)
      .maybeSingle();

    if (customerLookupError) {
      return NextResponse.json({ error: "Kunduppgifterna kunde inte kontrolleras." }, { status: 500 });
    }

    let customerId = existingCustomer?.id;
    if (!customerId) {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({ restaurant_id: restaurant.id, name: customer.name.trim(), phone })
        .select("id")
        .single();

      if (customerError || !newCustomer) {
        return NextResponse.json({ error: "Kunduppgifterna kunde inte sparas." }, { status: 500 });
      }
      customerId = newCustomer.id;
    } else {
      await supabase.from("customers").update({ name: customer.name.trim() }).eq("id", customerId);
    }

    const orderNumber = "T" + Date.now().toString();
    const trackingToken = randomBytes(32).toString("hex");
    const trackingTokenHash = createHash("sha256").update(trackingToken).digest("hex");
    const trackingExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
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
        payment_method: paymentMethod,
        customer_tracking_token_hash: trackingTokenHash,
        customer_tracking_expires_at: trackingExpiresAt,
      })
      .select("id,order_number")
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


    if (paymentMethod === "online") {
      const origin = new URL(request.url).origin;
      const form = new URLSearchParams();
      form.set("mode", "payment");
      form.set("success_url", `${origin}/order/${trackingToken}?payment=success`);
      form.set("cancel_url", `${origin}/order/${trackingToken}?payment=cancelled`);
      form.set("client_reference_id", order.id);
      form.set("metadata[order_id]", order.id);
      form.set("metadata[restaurant_id]", restaurant.id);
      form.set("payment_intent_data[metadata][order_id]", order.id);
      form.set("payment_intent_data[metadata][restaurant_id]", restaurant.id);
      form.set("line_items[0][price_data][currency]", "sek");
      form.set("line_items[0][price_data][unit_amount]", String(Math.round(subtotal * 100)));
      form.set("line_items[0][price_data][product_data][name]", `Tapco Pizza – order ${order.order_number}`);
      form.set("line_items[0][quantity]", "1");

      const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      });
      const stripeSession = await stripeResponse.json() as { id?: string; url?: string; error?: { message?: string } };

      if (!stripeResponse.ok || !stripeSession.id || !stripeSession.url) {
        console.error("[orders] Stripe Checkout creation failed", stripeSession.error?.message);
        await supabase.from("orders").delete().eq("id", order.id).eq("restaurant_id", restaurant.id);
        return NextResponse.json({ error: "Betalningen kunde inte startas. Försök igen." }, { status: 502 });
      }

      const { error: paymentError } = await supabase.from("payments").insert({
        restaurant_id: restaurant.id,
        order_id: order.id,
        provider: "stripe",
        provider_payment_id: stripeSession.id,
        amount: subtotal,
        currency: "SEK",
        status: "pending",
      });

      if (paymentError) {
        console.error("[orders] Payment record insert failed", paymentError.message);
        await fetch(`https://api.stripe.com/v1/checkout/sessions/${stripeSession.id}/expire`, {
          method: "POST",
          headers: { Authorization: `Bearer ${stripeSecretKey}` },
        });
        await supabase.from("orders").delete().eq("id", order.id).eq("restaurant_id", restaurant.id);
        return NextResponse.json({ error: "Betalningen kunde inte registreras. Försök igen." }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        orderNumber: order.order_number,
        trackingToken,
        checkoutUrl: stripeSession.url,
      }, { status: 201 });
    }

    return NextResponse.json({ success: true, orderNumber: order.order_number, trackingToken }, { status: 201 });
  } catch (error) {
    console.error("[orders] Unexpected order API error", error);
    return NextResponse.json({ error: "Ett oväntat fel uppstod när beställningen skulle sparas." }, { status: 500 });
  }
}
