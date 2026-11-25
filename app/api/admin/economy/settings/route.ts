import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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
  const { data: restaurant } = await db.from("restaurants").select("id").eq("slug", "tapco-pizza").eq("is_active", true).single();
  if (!restaurant) return null;
  const { data: member } = await db.from("restaurant_users").select("role").eq("restaurant_id", restaurant.id).eq("user_id", data.user.id).maybeSingle();
  if (!member || !["owner", "admin", "manager"].includes(member.role)) return null;
  return { db, restaurant };
}

export async function PUT(request: Request) {
  const access = await authorize(request);
  if (!access) return NextResponse.json({ error: "Du saknar behörighet." }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Ogiltiga inställningar." }, { status: 400 }); }
  const legalName = typeof body.legal_name === "string" ? body.legal_name.trim().slice(0, 160) : "";
  const organizationNumber = typeof body.organization_number === "string" ? body.organization_number.trim().slice(0, 40) : "";
  const accountantEmail = typeof body.accountant_email === "string" ? body.accountant_email.trim().slice(0, 254) : "";
  const vatRate = Number(body.vat_rate);
  const timezone = typeof body.timezone === "string" ? body.timezone : "Europe/Stockholm";
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) return NextResponse.json({ error: "Momssatsen måste vara mellan 0 och 100." }, { status: 400 });
  if (accountantEmail && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(accountantEmail)) return NextResponse.json({ error: "Ange en giltig e-postadress." }, { status: 400 });
  try { new Intl.DateTimeFormat("sv-SE", { timeZone: timezone }); } catch { return NextResponse.json({ error: "Ogiltig tidszon." }, { status: 400 }); }

  const { data, error } = await access.db.from("restaurant_finance_settings").upsert({
    restaurant_id: access.restaurant.id,
    legal_name: legalName || null,
    organization_number: organizationNumber || null,
    accountant_email: accountantEmail || null,
    vat_rate: vatRate,
    timezone,
    updated_at: new Date().toISOString()
  }, { onConflict: "restaurant_id" }).select("legal_name,organization_number,accountant_email,vat_rate,timezone").single();
  if (error) {
    console.error("[economy-settings] Save failed", error.message);
    return NextResponse.json({ error: "Inställningarna kunde inte sparas." }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}
