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

// Convert a restaurant-local calendar date to its UTC boundary.
function localDateToUtc(date: string, timeZone: string, end = false) {
  const [year, month, day] = date.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day + (end ? 1 : 0));
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const represented = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day),
      Number(values.hour), Number(values.minute), Number(values.second));
    guess += target - represented;
  }
  return new Date(guess).toISOString();
}

async function fetchStripeTransactions(secret: string, start: number, end: number) {
  const transactions: any[] = [];
  let startingAfter: string | undefined;
  let hasMore = true;
  while (hasMore && transactions.length < 1000) {
    const query = new URLSearchParams({
      limit: "100",
      "created[gte]": String(start),
      "created[lt]": String(end),
    });
    if (startingAfter) query.set("starting_after", startingAfter);
    const response = await fetch("https://api.stripe.com/v1/balance_transactions?" + query, {
      headers: { Authorization: "Bearer " + secret }, cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body?.error?.message || "Stripe kunde inte läsas.");
    const page = Array.isArray(body.data) ? body.data : [];
    transactions.push(...page);
    hasMore = Boolean(body.has_more);
    startingAfter = page.at(-1)?.id;
    if (hasMore && !startingAfter) throw new Error("Stripe returnerade en ofullständig transaktionssida.");
  }
  return { transactions, truncated: hasMore };
}

export async function GET(request: Request) {
  const access = await authorize(request);
  if (!access) return NextResponse.json({ error: "Du saknar behörighet." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const from = params.get("from");
  const to = params.get("to");
  if (!from || !to || !/^\\d{4}-\\d{2}-\\d{2}$/.test(from) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(to) || from > to) {
    return NextResponse.json({ error: "Välj ett giltigt datumintervall." }, { status: 400 });
  }

  const { data: settings } = await access.db.from("restaurant_finance_settings")
    .select("*").eq("restaurant_id", access.restaurant.id).maybeSingle();
  const timezone = settings?.timezone || "Europe/Stockholm";
  let start: string, end: string;
  try {
    start = localDateToUtc(from, timezone);
    end = localDateToUtc(to, timezone, true);
  } catch {
    return NextResponse.json({ error: "Ogiltig tidszon i ekonomiinställningarna." }, { status: 400 });
  }

  const [{ data: orders, error }] = await Promise.all([
    access.db.from("orders")
      .select("id,order_number,created_at,total,subtotal,discount_amount,currency,payment_method,payment_status,status,vat_rate,vat_amount")
      .eq("restaurant_id", access.restaurant.id).gte("created_at", start).lt("created_at", end)
      .order("created_at", { ascending: true }).limit(10000)
  ]);
  if (error) return NextResponse.json({ error: "Försäljningsdata kunde inte hämtas." }, { status: 500 });

  let stripeTransactions: any[] = [];
  let stripeError: string | null = null;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (secret) {
    try {
      const result = await fetchStripeTransactions(secret, Math.floor(new Date(start).getTime() / 1000), Math.floor(new Date(end).getTime() / 1000));
      stripeTransactions = result.transactions;
      if (result.truncated) stripeError = "Rapporten har nått säkerhetsgränsen 1 000 Stripe-transaktioner. Dela upp perioden för fullständig avstämning.";
    } catch (e) {
      stripeError = e instanceof Error ? e.message : "Stripe-data kunde inte hämtas.";
    }
  } else stripeError = "Stripe är inte konfigurerat.";

  const rows = orders || [];
  const paid = rows.filter((o: any) => ["paid", "refunded", "partially_refunded"].includes(o.payment_status));
  const sum = (items: any[], key: string) => items.reduce((n, item) => n + Number(item[key] || 0), 0);
  const refunds = stripeTransactions.filter(t => t.type === "refund")
    .reduce((n, t) => n + Math.abs(Number(t.amount || 0)) / 100, 0);
  const payoutTransactions = stripeTransactions.filter(t => t.type === "payout");
  const payouts = payoutTransactions.reduce((n, t) => n + Math.abs(Number(t.amount || 0)) / 100, 0);
  const fees = sum(stripeTransactions, "fee") / 100;
  const net = sum(stripeTransactions.filter(t => t.type !== "payout" && t.type !== "payout_cancel" && t.type !== "payout_failure"), "net") / 100;

  return NextResponse.json({
    restaurant: access.restaurant.name, from, to, timezone, settings: settings || null,
    summary: {
      sales: sum(paid, "total"),
      online: sum(paid.filter((o: any) => o.payment_method === "online"), "total"),
      refunds, orderCount: paid.length, stripeFees: fees, stripeNet: net, payouts,
      vatKnown: paid.every((o: any) => o.vat_amount !== null && o.vat_amount !== undefined),
      vat: sum(paid, "vat_amount")
    },
    orders: rows, stripeTransactions, stripeError
  });
}
