import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const transitions: Record<string, string[]> = {
  new: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
};

async function getAuthorizedRestaurant(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !publishableKey || !serviceKey) return null;

  const authClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return null;

  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: restaurant } = await db.from("restaurants")
    .select("id,name").eq("slug", "tapco-pizza").eq("is_active", true).single();
  if (!restaurant) return null;

  const { data: membership } = await db.from("restaurant_users")
    .select("id,role").eq("restaurant_id", restaurant.id)
    .eq("user_id", authData.user.id).maybeSingle();
  if (!membership) return null;

  return { db, restaurant, user: authData.user, role: membership.role };
}

export async function GET(request: Request) {
  const access = await getAuthorizedRestaurant(request);
  if (!access) return NextResponse.json({ error: "Du saknar behörighet." }, { status: 401 });

  const { data, error } = await access.db.from("orders")
    .select("id,order_number,status,payment_status,order_type,customer_name,customer_phone,delivery_address,special_instructions,subtotal,discount_amount,total,currency,created_at,requested_for,accepted_at,completed_at,order_items(id,product_name,quantity,unit_price,selected_options,removed_ingredients,special_instructions,line_total)")
    .eq("restaurant_id", access.restaurant.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[admin/orders] Read failed", error.message);
    return NextResponse.json({ error: "Beställningarna kunde inte hämtas." }, { status: 500 });
  }
  return NextResponse.json({ orders: data ?? [], restaurant: access.restaurant.name });
}

export async function PATCH(request: Request) {
  const access = await getAuthorizedRestaurant(request);
  if (!access) return NextResponse.json({ error: "Du saknar behörighet." }, { status: 401 });

  let body: { orderId?: string; status?: string; expectedStatus?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Ogiltig förfrågan." }, { status: 400 });
  }

  const { orderId, status, expectedStatus } = body;
  if (!orderId || !status || !expectedStatus || !transitions[expectedStatus]?.includes(status)) {
    return NextResponse.json({ error: "Otillåten statusändring." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status, updated_at: now };
  if (status === "accepted") update.accepted_at = now;
  if (status === "completed") update.completed_at = now;

  const { data, error } = await access.db.from("orders")
    .update(update)
    .eq("id", orderId)
    .eq("restaurant_id", access.restaurant.id)
    .eq("status", expectedStatus)
    .select("id,status,accepted_at,completed_at")
    .maybeSingle();

  if (error) {
    console.error("[admin/orders] Update failed", error.message);
    return NextResponse.json({ error: "Statusen kunde inte uppdateras." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Ordern har redan ändrats på en annan enhet. Uppdatera listan." }, { status: 409 });
  }
  return NextResponse.json({ order: data });
}
