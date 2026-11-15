import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: "Orderlänken är ogiltig." }, { status: 404 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Ordertjänsten är inte tillgänglig." }, { status: 503 });
    }

    const db = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data: order, error } = await db.from("orders")
      .select("order_number,status,order_type,payment_status,total,currency,created_at,estimated_ready_at,ready_at,customer_tracking_expires_at,order_items(product_name,quantity,selected_options,removed_ingredients,special_instructions,line_total)")
      .eq("customer_tracking_token_hash", tokenHash)
      .gt("customer_tracking_expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error("[order-tracking] Lookup failed", error.message);
      return NextResponse.json({ error: "Ordern kunde inte hämtas." }, { status: 500 });
    }
    if (!order) return NextResponse.json({ error: "Orderlänken har gått ut eller är ogiltig." }, { status: 404 });

    const { customer_tracking_expires_at: _expires, ...safeOrder } = order;
    return NextResponse.json({ order: safeOrder }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[order-tracking] Unexpected error", error);
    return NextResponse.json({ error: "Ett oväntat fel uppstod." }, { status: 500 });
  }
}
