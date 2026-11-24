import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const parts = signature.split(",").map((part) => part.split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = createHmac("sha256", secret).update(timestamp + "." + payload).digest("hex");
  return signatures.some((value) => {
    if (!/^[a-f0-9]{64}$/i.test(value)) return false;
    const actualBuffer = Buffer.from(value, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  }

  const payload = await request.text();
  if (!verifyStripeSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  let event: {
    type: string;
    data?: { object?: {
      id?: string;
      metadata?: { order_id?: string; restaurant_id?: string };
      payment_status?: string;
      payment_intent?: string | null;
    } };
  };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  const session = event.data?.object;
  const orderId = session?.metadata?.order_id;
  const restaurantId = session?.metadata?.restaurant_id;
  if (!session?.id || !orderId || !restaurantId) {
    return NextResponse.json({ received: true });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Payment storage is not configured." }, { status: 503 });

  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  let paymentStatus: "succeeded" | "failed" | "processing" | null = null;
  let orderPaymentStatus: "paid" | "failed" | null = null;

  if (event.type === "checkout.session.completed") {
    if (session.payment_status === "paid") {
      paymentStatus = "succeeded";
      orderPaymentStatus = "paid";
    } else {
      paymentStatus = "processing";
    }
  } else if (event.type === "checkout.session.async_payment_succeeded") {
    paymentStatus = "succeeded";
    orderPaymentStatus = "paid";
  } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
    paymentStatus = "failed";
    orderPaymentStatus = "failed";
  } else {
    return NextResponse.json({ received: true });
  }

  const { data: payment, error: paymentLookupError } = await db.from("payments")
    .select("id").eq("restaurant_id", restaurantId).eq("order_id", orderId)
    .eq("provider", "stripe").eq("provider_payment_id", session.id).maybeSingle();

  if (paymentLookupError) {
    console.error("[stripe-webhook] Payment lookup failed", paymentLookupError.message);
    return NextResponse.json({ error: "Payment lookup failed." }, { status: 500 });
  }
  if (!payment) return NextResponse.json({ received: true });

  const { error: updatePaymentError } = await db.from("payments")
    .update({ status: paymentStatus, updated_at: new Date().toISOString() })
    .eq("id", payment.id);
  if (updatePaymentError) {
    console.error("[stripe-webhook] Payment update failed", updatePaymentError.message);
    return NextResponse.json({ error: "Payment update failed." }, { status: 500 });
  }

  if (orderPaymentStatus) {
    const { error: updateOrderError } = await db.from("orders")
      .update({ payment_status: orderPaymentStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId).eq("restaurant_id", restaurantId).eq("payment_method", "online");
    if (updateOrderError) {
      console.error("[stripe-webhook] Order update failed", updateOrderError.message);
      return NextResponse.json({ error: "Order update failed." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
