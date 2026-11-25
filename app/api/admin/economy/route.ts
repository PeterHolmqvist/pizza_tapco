import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorize(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !anon || !service) return null;
  const auth = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await auth.auth.getUser(token);
  if (!data.user) return null;
  const db = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: restaurant } = await db.from("restaurants").select("id,name").eq("slug", "tapco-pizza").eq("is_active", true).single();
  if (!restaurant) return null;
  const { data: member } = await db.from("restaurant_users").select("role").eq("restaurant_id", restaurant.id).eq("user_id", data.user.id).maybeSingle();
  if (!member || !["owner", "admin", "manager"].includes(member.role)) return null;
  return { db, restaurant };
}

export async function GET(request: Request) {
  const access = await authorize(request);
  if (!access) return NextResponse.json({ error: "Du saknar behörighet." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const from = params.get("from");
  const to = params.get("to");
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
    return NextResponse.json({ error: "Välj ett giltigt datumintervall." }, { status: 400 });
  }
  const start = new Date(from + "T00:00:00.000Z").toISOString();
  const end = new Date(new Date(to + "T00:00:00.000Z").getTime() + 86400000).toISOString();
  const [{ data: orders, error }, { data: settings }] = await Promise.all([
    access.db.from("orders").select("id,order_number,created_at,total,subtotal,discount_amount,currency,payment_method,payment_status,status,vat_rate,vat_amount")
      .eq("restaurant_id", access.restaurant.id).gte("created_at", start).lt("created_at", end).order("created_at", { ascending: true }).limit(5000),
    access.db.from("restaurant_finance_settings").select("*").eq("restaurant_id", access.restaurant.id).maybeSingle()
  ]);
  if (error) return NextResponse.json({ error: "Försäljningsdata kunde inte hämtas." }, { status: 500 });

  let stripeTransactions: unknown[] = [];
  let stripeError: string | null = null;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (secret) {
    try {
      const query = new URLSearchParams({ limit: "100", "created[gte]": String(Math.floor(new Date(start).getTime()/1000)), "created[lt]": String(Math.floor(new Date(end).getTime()/1000)) });
      const response = await fetch("https://api.stripe.com/v1/balance_transactions?" + query.toString(), { headers: { Authorization: "Bearer " + secret }, cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || "Stripe kunde inte läsas.");
      stripeTransactions = body.data || [];
      if (body.has_more) stripeError = "Fler än 100 Stripe-transaktioner finns i perioden. Fullständig paginering behöver köras.";
    } catch (e) { stripeError = e instanceof Error ? e.message : "Stripe-data kunde inte hämtas."; }
  } else stripeError = "Stripe är inte konfigurerat.";

  const rows = orders || [];
  const paid = rows.filter((o: any) => o.payment_status === "paid" || o.payment_status === "refunded" || o.payment_status === "partially_refunded");
  const sum = (items: any[], key: string) => items.reduce((n, item) => n + Number(item[key] || 0), 0);
  const refunds = stripeTransactions.filter((t: any) => t.type === "refund").reduce((n: number, t: any) => n + Math.abs(Number(t.amount || 0))/100, 0);
  const fees = sum(stripeTransactions as any[], "fee") / 100;
  const net = sum(stripeTransactions as any[], "net") / 100;
  return NextResponse.json({
    restaurant: access.restaurant.name, from, to, settings: settings || null,
    summary: {
      sales: sum(paid, "total"), online: sum(paid.filter((o: any) => o.payment_method === "online"), "total"),
      refunds, orderCount: paid.length, stripeFees: fees, stripeNet: net,
      vatKnown: paid.every((o: any) => o.vat_amount !== null && o.vat_amount !== undefined),
      vat: sum(paid, "vat_amount")
    },
    orders: rows, stripeTransactions, stripeError
  });
}
