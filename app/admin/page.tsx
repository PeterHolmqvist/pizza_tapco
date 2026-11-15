"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock3, LogOut, MapPin, Phone, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type OrderItem = {
  id: string; product_name: string; quantity: number; unit_price: number;
  selected_options: { name: string; price: number }[]; removed_ingredients: string[];
  special_instructions: string | null; line_total: number;
};
type Order = {
  id: string; order_number: string; status: string; payment_status: string;
  order_type: string; customer_name: string | null; customer_phone: string | null;
  delivery_address: string | null; special_instructions: string | null;
  total: number; currency: string; created_at: string; requested_for: string | null;
  accepted_at: string | null; estimated_ready_at: string | null; ready_at: string | null;
  order_items: OrderItem[];
};

const statusNames: Record<string, string> = {
  new: "Ny", accepted: "Accepterad", preparing: "Tillagas", ready: "Klar",
  completed: "Avslutad", rejected: "Avvisad", cancelled: "Avbruten",
};
const nextStatus: Record<string, { status: string; label: string }> = {
  new: { status: "accepted", label: "Acceptera order" },
  accepted: { status: "preparing", label: "Börja tillaga" },
  preparing: { status: "ready", label: "Markera som klar" },
  ready: { status: "completed", label: "Avsluta order" },
};

function paymentLabel(status: string) {
  if (status === "paid") return { label: "Betald", className: "bg-red-100 text-red-800" };
  if (status === "pending") return { label: "Betalas i butik", className: "bg-green-100 text-green-800" };
  if (status === "failed") return { label: "Betalning misslyckades", className: "bg-amber-100 text-amber-800" };
  if (status === "refunded") return { label: "Återbetald", className: "bg-slate-100 text-slate-700" };
  return { label: "Delvis återbetald", className: "bg-amber-100 text-amber-800" };
}
function timeLabel(value: string) {
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function AdminPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sound, setSound] = useState(false);
  const [tab, setTab] = useState<"active" | "history">("active");
  const [pendingAcceptance, setPendingAcceptance] = useState<Order | null>(null);
  const [etaMinutes, setEtaMinutes] = useState("20");
  const lastNewCount = useRef(0);
  const soundEnabled = useRef(false);

  const loadOrders = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const { data: sessionData } = await supabaseBrowser.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) { router.replace("/admin/login"); return; }
    const response = await fetch("/api/admin/orders", {
      headers: { Authorization: "Bearer " + token }, cache: "no-store",
    });
    if (response.status === 401) {
      await supabaseBrowser.auth.signOut();
      router.replace("/admin/login");
      return;
    }
    const result = await response.json();
    if (!response.ok) setError(result.error || "Kunde inte hämta ordrar.");
    else {
      const nextOrders = result.orders as Order[];
      const newCount = nextOrders.filter(order => order.status === "new").length;
      if (newCount > lastNewCount.current && soundEnabled.current) {
        try {
          const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            const context = new AudioContextClass();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.frequency.value = 880;
            gain.gain.value = 0.12;
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.22);
            oscillator.onended = () => context.close();
          }
        } catch { /* Audio is optional; visual updates still work. */ }
      }
      lastNewCount.current = newCount;
      setOrders(nextOrders);
      setError("");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadOrders(true);
    const timer = window.setInterval(() => loadOrders(false), 8000);
    return () => window.clearInterval(timer);
  }, [loadOrders]);

  async function changeStatus(order: Order, status: string, minutes?: number) {
    if (status === "accepted" && minutes === undefined) {
      setEtaMinutes("20");
      setPendingAcceptance(order);
      return;
    }
    setWorking(order.id);
    setError("");
    const { data } = await supabaseBrowser.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { router.replace("/admin/login"); return; }
    let estimatedReadyAt: string | undefined;
    if (status === "accepted" && minutes !== undefined) {
      estimatedReadyAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    }
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ orderId: order.id, status, expectedStatus: order.status, estimatedReadyAt }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Statusen kunde inte ändras.");
    await loadOrders(false);
    setWorking(null);
    if (status === "accepted") setPendingAcceptance(null);
  }

  function confirmAcceptance() {
    const minutes = Number(etaMinutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 720 || !pendingAcceptance) return;
    void changeStatus(pendingAcceptance, "accepted", minutes);
  }

  async function signOut() {
    await supabaseBrowser.auth.signOut();
    router.replace("/admin/login");
  }

  const visibleOrders = useMemo(() => orders.filter(order =>
    tab === "active"
      ? !["completed", "rejected", "cancelled"].includes(order.status)
      : ["completed", "rejected", "cancelled"].includes(order.status)
  ), [orders, tab]);
  const newCount = orders.filter(order => order.status === "new").length;
  const activeCount = orders.filter(order => !["completed", "rejected", "cancelled"].includes(order.status)).length;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-orange-600">Tapco Pizza</p><h1 className="text-xl font-bold">Ordermottagning</h1></div>
          <div className="flex items-center gap-2">
            <button onClick={() => { const enabled = !sound; setSound(enabled); soundEnabled.current = enabled; }} aria-label={sound ? "Stäng av ljud" : "Aktivera ljud"} className="rounded-lg border p-2 text-slate-600">{sound ? <Volume2 size={19} /> : <VolumeX size={19} />}</button>
            <button onClick={() => loadOrders(true)} aria-label="Uppdatera" className="rounded-lg border p-2 text-slate-600"><RefreshCw size={19} /></button>
            <button onClick={signOut} aria-label="Logga ut" className="rounded-lg border p-2 text-slate-600"><LogOut size={19} /></button>
          </div>
        </div>
      </header>

      {pendingAcceptance && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={(event) => { if (event.target === event.currentTarget) setPendingAcceptance(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="eta-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <h2 id="eta-title" className="text-xl font-bold">Bekräfta beställningen</h2>
          <p className="mt-2 text-sm text-slate-600">Ange ungefär hur många minuter det tar innan order #{pendingAcceptance.order_number} är klar för upphämtning.</p>
          <label htmlFor="eta-minutes" className="mt-5 block text-sm font-semibold text-slate-700">Beräknad tid (minuter)</label>
          <input id="eta-minutes" type="number" min="1" max="720" step="1" inputMode="numeric" value={etaMinutes} onChange={(event) => setEtaMinutes(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") confirmAcceptance(); }} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-lg font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" autoFocus />
          <p className="mt-2 text-xs text-slate-500">1–720 minuter. Tiden visas för kunden efter bekräftelsen.</p>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setPendingAcceptance(null)} className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700">Avbryt</button>
            <button type="button" onClick={confirmAcceptance} disabled={!Number.isInteger(Number(etaMinutes)) || Number(etaMinutes) < 1 || Number(etaMinutes) > 720 || working !== null} className="flex-1 rounded-lg bg-orange-600 px-4 py-3 font-bold text-white hover:bg-orange-700 disabled:opacity-50">Bekräfta order</button>
          </div>
        </section>
      </div>}
      <section className="mx-auto max-w-5xl px-3 py-4 sm:px-4">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Nya beställningar</p><p className="mt-1 text-3xl font-bold">{newCount}</p></div>
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Aktiva ordrar</p><p className="mt-1 text-3xl font-bold">{activeCount}</p></div>
        </div>

        <div className="mb-4 flex rounded-xl bg-white p-1 shadow-sm">
          <button onClick={() => setTab("active")} className={"flex-1 rounded-lg px-3 py-3 text-sm font-semibold " + (tab === "active" ? "bg-slate-900 text-white" : "text-slate-600")}>Aktiva ({activeCount})</button>
          <button onClick={() => setTab("history")} className={"flex-1 rounded-lg px-3 py-3 text-sm font-semibold " + (tab === "history" ? "bg-slate-900 text-white" : "text-slate-600")}>Historik</button>
        </div>

        {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? <div className="py-16 text-center text-slate-500">Hämtar beställningar...</div> :
          visibleOrders.length === 0 ? <div className="rounded-xl bg-white px-4 py-14 text-center shadow-sm"><Bell className="mx-auto mb-3 text-slate-300" size={30} /><p className="font-semibold">Inga {tab === "active" ? "aktiva beställningar" : "avslutade beställningar"}</p><p className="mt-1 text-sm text-slate-500">Nya beställningar visas här automatiskt.</p></div> :
          <div className="grid gap-3 md:grid-cols-2">
            {visibleOrders.map(order => {
              const payment = paymentLabel(order.payment_status);
              const action = nextStatus[order.status];
              return <article key={order.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
                  <div><p className="text-xs text-slate-500">{timeLabel(order.created_at)}</p><h2 className="text-xl font-bold">#{order.order_number}</h2><p className="mt-1 text-sm font-medium text-slate-600">{statusNames[order.status] || order.status}</p></div>
                  <span className={"rounded-full px-3 py-1.5 text-xs font-bold " + payment.className}>{payment.label}</span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">{order.customer_name || "Kund"}</span>
                    {order.customer_phone && <a className="inline-flex items-center gap-1 underline" href={"tel:" + order.customer_phone}><Phone size={14} />{order.customer_phone}</a>}
                    <span className="inline-flex items-center gap-1"><MapPin size={14} />{order.order_type === "delivery" ? "Leverans" : "Avhämtning"}</span>
                  </div>
                  {order.delivery_address && <p className="text-sm text-slate-600">{order.delivery_address}</p>}
                  {order.estimated_ready_at && !["ready", "completed", "rejected", "cancelled"].includes(order.status) && <p className="inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-800"><Clock3 size={15} /> Beräknad klar: {timeLabel(order.estimated_ready_at)}</p>}
                  {order.ready_at && <p className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800"><Check size={15} /> Klar {timeLabel(order.ready_at)}</p>}
                  <div className="divide-y divide-slate-100 rounded-lg bg-slate-50 px-3">
                    {(order.order_items || []).map(item => <div key={item.id} className="py-3">
                      <div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{item.quantity} × {item.product_name}</span><span className="shrink-0">{item.line_total} kr</span></div>
                      {!!item.selected_options?.length && <p className="mt-1 text-xs text-slate-600">Tillval: {item.selected_options.map(option => option.name).join(", ")}</p>}
                      {!!item.removed_ingredients?.length && <p className="mt-1 text-xs text-slate-600">Utan: {item.removed_ingredients.join(", ")}</p>}
                      {item.special_instructions && <p className="mt-1 text-sm font-medium text-orange-800">Önskemål: {item.special_instructions}</p>}
                    </div>)}
                  </div>
                  {order.special_instructions && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><strong>Kommentar till ordern:</strong> {order.special_instructions}</div>}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm text-slate-500">Totalt</span><strong className="text-xl">{Number(order.total).toFixed(2)} kr</strong></div>
                  {action && tab === "active" && <button disabled={working === order.id} onClick={() => changeStatus(order, action.status)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3.5 font-bold text-white hover:bg-orange-700 disabled:opacity-50">{working === order.id ? <Clock3 className="animate-spin" size={18} /> : <Check size={18} />}{action.label}</button>}
                  {order.status === "new" && <p className="text-center text-xs text-slate-500">Registrera eventuell betalning i kassasystemet separat.</p>}
                </div>
              </article>;
            })}
          </div>
        }
        <p className="mt-6 text-center text-xs text-slate-400">Uppdateras automatiskt var 8:e sekund · Kassaregistrering görs separat</p>
      </section>
    </main>
  );
}
