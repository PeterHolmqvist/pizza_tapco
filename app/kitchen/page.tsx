"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock3, LogOut, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type KitchenItem = {
  id: string;
  product_name: string;
  quantity: number;
  selected_options: { name: string; price: number }[];
  removed_ingredients: string[];
  special_instructions: string | null;
};

type KitchenOrder = {
  id: string;
  order_number: string;
  status: string;
  order_type: string;
  customer_name: string | null;
  created_at: string;
  estimated_ready_at: string | null;
  order_items: KitchenItem[];
};

function clock(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function KitchenPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const [pending, setPending] = useState<KitchenOrder | null>(null);
  const [minutes, setMinutes] = useState(15);
  const [now, setNow] = useState(Date.now());

  const loadOrders = useCallback(async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.replace("/admin/login?next=/kitchen");
      return;
    }
    const response = await fetch("/api/admin/orders", {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
    });
    if (response.status === 401) {
      await supabaseBrowser.auth.signOut();
      router.replace("/admin/login?next=/kitchen");
      return;
    }
    const result = await response.json();
    if (!response.ok) setError(result.error || "Kunde inte hämta beställningar.");
    else {
      setOrders(result.orders || []);
      setError("");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadOrders();
    const poll = window.setInterval(() => void loadOrders(), 8000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
  }, [loadOrders]);

  async function updateOrder(order: KitchenOrder, status: "preparing" | "ready", eta?: number) {
    setWorking(order.id);
    setError("");
    const { data } = await supabaseBrowser.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.replace("/admin/login?next=/kitchen");
      return;
    }
    const expectedStatus = order.status;
    const estimatedReadyAt = eta ? new Date(Date.now() + eta * 60_000).toISOString() : undefined;
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ orderId: order.id, status, expectedStatus, estimatedReadyAt }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Ordern kunde inte uppdateras.");
    await loadOrders();
    setWorking(null);
    setPending(null);
  }

  async function signOut() {
    await supabaseBrowser.auth.signOut();
    router.replace("/admin/login?next=/kitchen");
  }

  const newOrders = useMemo(() => orders.filter(order => order.status === "new"), [orders]);
  const preparingOrders = useMemo(() => orders.filter(order => order.status === "preparing" || order.status === "accepted"), [orders]);
  const readyOrders = useMemo(() => orders.filter(order => order.status === "ready"), [orders]);

  async function toggleSound() {
    const next = !sound;
    setSound(next);
    if (next) {
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const context = new AudioContextClass();
          await context.resume();
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.frequency.value = 880;
          gain.gain.value = 0.08;
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start();
          oscillator.stop(context.currentTime + 0.12);
          oscillator.onended = () => context.close();
        }
      } catch {}
    }
  }

  function remaining(value: string | null) {
    if (!value) return null;
    const seconds = Math.ceil((new Date(value).getTime() - now) / 1000);
    if (seconds <= 0) return "Tiden passerad";
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0") + " kvar";
  }

  function OrderCard({ order, mode }: { order: KitchenOrder; mode: "new" | "preparing" | "ready" }) {
    const timeLeft = remaining(order.estimated_ready_at);
    return (
      <article className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-lg">
        <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Order</p>
            <h3 className="text-2xl font-black">#{order.order_number}</h3>
          </div>
          <span className={"rounded-full px-3 py-1 text-xs font-bold " + (mode === "new" ? "bg-amber-400 text-slate-950" : mode === "ready" ? "bg-emerald-400 text-slate-950" : "bg-sky-400 text-slate-950")}>
            {mode === "new" ? "NY" : mode === "ready" ? "KLAR" : "TILLAGAS"}
          </span>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex justify-between text-sm text-slate-300">
            <span>{order.order_type === "delivery" ? "Leverans" : "Avhämtning"}</span>
            <span>{clock(order.created_at)}</span>
          </div>
          <div className="space-y-3">
            {order.order_items?.map(item => (
              <div key={item.id} className="border-b border-slate-700 pb-3 last:border-0">
                <p className="text-lg font-bold">{item.quantity} × {item.product_name}</p>
                {!!item.selected_options?.length && <p className="mt-1 text-sm text-slate-300">Tillval: {item.selected_options.map(option => option.name).join(", ")}</p>}
                {!!item.removed_ingredients?.length && <p className="mt-1 text-sm text-amber-200">Utan: {item.removed_ingredients.join(", ")}</p>}
                {item.special_instructions && <p className="mt-1 rounded bg-amber-400/10 p-2 text-sm font-semibold text-amber-200">OBS: {item.special_instructions}</p>}
              </div>
            ))}
          </div>
          {mode === "preparing" && <div className="rounded-xl bg-slate-900 px-3 py-3 text-center"><p className="text-xs text-slate-400">Beräknad upphämtning</p><p className="text-xl font-black text-sky-300">{clock(order.estimated_ready_at)}</p><p className={"text-sm font-semibold " + (timeLeft === "Tiden passerad" ? "text-amber-300" : "text-slate-300")}>{timeLeft}</p></div>}
          {mode === "new" && <button disabled={working === order.id} onClick={() => { setMinutes(15); setPending(order); }} className="w-full rounded-xl bg-orange-500 px-4 py-4 text-lg font-black text-white shadow hover:bg-orange-400 disabled:opacity-50">Acceptera · Tillaga</button>}
          {mode === "preparing" && <button disabled={working === order.id} onClick={() => void updateOrder(order, "ready")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-4 text-lg font-black text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{working === order.id ? "Sparar..." : <><Check size={22} /> Klar</>}</button>}
          {mode === "ready" && <p className="rounded-xl bg-emerald-500/10 px-3 py-3 text-center font-bold text-emerald-300">Väntar på avhämtning · Klar {clock(order.estimated_ready_at)}</p>}
        </div>
      </article>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">T-App-Co</p><h1 className="text-2xl font-black">Kitchen</h1></div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-800 px-3 py-2 text-sm font-bold">{newOrders.length} nya</span>
            <button onClick={() => void toggleSound()} aria-label={sound ? "Stäng av ljud" : "Aktivera ljud"} className="rounded-xl bg-slate-800 p-3">{sound ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
            <button onClick={() => void loadOrders()} aria-label="Uppdatera" className="rounded-xl bg-slate-800 p-3"><RefreshCw size={20} /></button>
            <button onClick={signOut} aria-label="Logga ut" className="rounded-xl bg-slate-800 p-3"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      {pending && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <section role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
          <h2 className="text-2xl font-black">Acceptera order #{pending.order_number}</h2>
          <p className="mt-2 text-sm text-slate-600">Hur lång tid behöver köket?</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[10, 15, 20].map(value => <button key={value} onClick={() => setMinutes(value)} className={"rounded-xl border-2 py-4 text-lg font-black " + (minutes === value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200")}>{value} min</button>)}
          </div>
          <label className="mt-4 block text-sm font-semibold" htmlFor="kitchen-eta">Egen tid (minuter)</label>
          <input id="kitchen-eta" type="number" min="1" max="720" value={minutes} onChange={event => setMinutes(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-xl font-bold"/>
          <div className="mt-5 flex gap-3">
            <button onClick={() => setPending(null)} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-bold">Avbryt</button>
            <button disabled={!Number.isInteger(minutes) || minutes < 1 || minutes > 720 || working !== null} onClick={() => void updateOrder(pending, "preparing", minutes)} className="flex-1 rounded-xl bg-orange-600 px-4 py-3 font-black text-white disabled:opacity-50">Starta</button>
          </div>
        </section>
      </div>}

      <section className="mx-auto max-w-7xl space-y-8 px-4 py-5">
        {error && <div role="alert" className="rounded-xl bg-red-950 p-3 text-red-200">{error}</div>}
        {loading ? <p className="py-16 text-center text-slate-400">Hämtar beställningar...</p> : <>
          <div>
            <div className="mb-3 flex items-center gap-2"><Bell className="text-amber-400"/><h2 className="text-xl font-black">Nya beställningar ({newOrders.length})</h2></div>
            {newOrders.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{newOrders.map(order => <OrderCard key={order.id} order={order} mode="new"/>)}</div> : <p className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-slate-500">Inga nya beställningar</p>}
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2"><Clock3 className="text-sky-400"/><h2 className="text-xl font-black">Tillagas ({preparingOrders.length})</h2></div>
            {preparingOrders.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{preparingOrders.map(order => <OrderCard key={order.id} order={order} mode="preparing"/>)}</div> : <p className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-slate-500">Inga ordrar tillagas just nu</p>}
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2"><Check className="text-emerald-400"/><h2 className="text-xl font-black">Klara för avhämtning ({readyOrders.length})</h2></div>
            {readyOrders.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{readyOrders.map(order => <OrderCard key={order.id} order={order} mode="ready"/>)}</div> : <p className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-slate-500">Inga färdiga ordrar</p>}
          </div>
        </>}
        <p className="flex items-center justify-center gap-2 pb-6 text-xs text-slate-500"><RefreshCw size={12}/> Uppdateras automatiskt var 8:e sekund</p>
      </section>
    </main>
  );
}
