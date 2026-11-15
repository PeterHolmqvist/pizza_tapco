"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Clock3, CookingPot, PackageCheck, RefreshCw } from "lucide-react";

type TrackedOrder = {
  order_number: string;
  status: string;
  order_type: string;
  payment_status: string;
  total: number;
  currency: string;
  created_at: string;
  estimated_ready_at: string | null;
  ready_at: string | null;
  order_items: {
    product_name: string;
    quantity: number;
    selected_options: { name: string; price: number }[];
    removed_ingredients: string[];
    special_instructions: string | null;
    line_total: number;
  }[];
};

const statusCopy: Record<string, { title: string; description: string; step: number }> = {
  new: { title: "Vi har tagit emot din beställning", description: "Restaurangen bekräftar din beställning strax.", step: 1 },
  accepted: { title: "Beställningen är bekräftad", description: "Restaurangen förbereder din beställning.", step: 2 },
  preparing: { title: "Din beställning tillagas", description: "Vi meddelar när den är klar för avhämtning.", step: 3 },
  ready: { title: "Din beställning är klar!", description: "Välkommen in och hämta din beställning.", step: 4 },
  completed: { title: "Beställningen är avslutad", description: "Tack för din beställning och välkommen åter!", step: 4 },
  rejected: { title: "Beställningen kunde inte tas emot", description: "Kontakta restaurangen om du behöver hjälp.", step: 0 },
  cancelled: { title: "Beställningen är avbruten", description: "Kontakta restaurangen om du har frågor.", step: 0 },
};

function formatTime(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function OrderTrackingPage() {
  const params = useParams<{ token: string }>();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    const response = await fetch("/api/orders/" + encodeURIComponent(params.token), { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Ordern kunde inte hämtas.");
      setLoading(false);
      return;
    }
    setOrder(result.order);
    setError("");
    setLoading(false);
  }, [params.token]);

  useEffect(() => {
    loadOrder();
    const timer = window.setInterval(loadOrder, 10000);
    return () => window.clearInterval(timer);
  }, [loadOrder]);

  const status = order ? statusCopy[order.status] ?? statusCopy.new : null;
  const terminal = order && ["completed", "rejected", "cancelled"].includes(order.status);

  useEffect(() => {
    if (terminal && typeof window !== "undefined") {
      sessionStorage.removeItem("tapco-active-order-tracking");
    }
  }, [terminal]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Tapco Pizza</p>
          <h1 className="mt-2 text-3xl font-black">Följ din beställning</h1>
        </div>

        {loading && !order ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-300">Hämtar din beställning...</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-900 bg-red-950/50 p-6 text-center">
            <p className="font-semibold">{error}</p>
          </div>
        ) : order && status ? (
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">Ordernummer</span>
                <span className="font-bold">#{order.order_number}</span>
              </div>
              <div className="my-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
                  {order.status === "ready" || order.status === "completed" ? <PackageCheck size={32} /> : order.status === "preparing" ? <CookingPot size={32} /> : <Clock3 size={32} />}
                </div>
                <h2 className="text-2xl font-bold">{status.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{status.description}</p>
                {order.estimated_ready_at && !["ready", "completed", "rejected", "cancelled"].includes(order.status) && (
                  <p className="mt-4 rounded-xl bg-slate-800 p-3 text-sm">
                    Beräknad upphämtning <strong className="text-white">{formatTime(order.estimated_ready_at)}</strong>
                  </p>
                )}
                {order.status === "ready" && <p className="mt-4 text-lg font-bold text-green-400">Välkommen att hämta!</p>}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {["Mottagen", "Bekräftad", "Tillagas", "Klar"].map((label, index) => (
                  <div key={label} className="text-center">
                    <div className={"mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full " + (status.step >= index + 1 ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-400")}>
                      {status.step >= index + 1 ? <CheckCircle2 size={16} /> : <span className="text-xs">{index + 1}</span>}
                    </div>
                    <span className="text-[10px] text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="mb-3 font-bold">Din beställning</h3>
              <div className="space-y-3">
                {order.order_items.map((item, index) => (
                  <div key={index} className="border-b border-slate-800 pb-3 last:border-0">
                    <div className="flex justify-between gap-3 text-sm">
                      <span>{item.quantity} × {item.product_name}</span>
                      <span className="shrink-0">{item.line_total} kr</span>
                    </div>
                    {!!item.selected_options?.length && <p className="mt-1 text-xs text-slate-400">Tillval: {item.selected_options.map(option => option.name).join(", ")}</p>}
                    {!!item.removed_ingredients?.length && <p className="mt-1 text-xs text-slate-400">Utan: {item.removed_ingredients.join(", ")}</p>}
                    {item.special_instructions && <p className="mt-1 text-xs text-amber-300">Önskemål: {item.special_instructions}</p>}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-800 pt-3 font-bold">
                <span>Totalt</span><span>{Number(order.total).toFixed(2)} kr</span>
              </div>
              <p className="mt-3 text-xs text-slate-400">Betalning: {order.payment_status === "paid" ? "Betald" : "Betalas i butik"}</p>
            </section>

            <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-500"><RefreshCw size={12} /> Status uppdateras automatiskt</p>
            {!terminal && <p className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-center text-sm text-orange-100">Stanna gärna kvar på sidan för att följa din order. Spara länken om du vill komma tillbaka senare.</p>}
          </div>
        ) : null}
      </div>
    </main>
  );
}
