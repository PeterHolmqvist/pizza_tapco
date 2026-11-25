"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileSpreadsheet, FileText, Mail, Settings2, RefreshCw } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ReportData = {
  restaurant: string; from: string; to: string;
  summary: { sales: number; online: number; refunds: number; orderCount: number; stripeFees: number; stripeNet: number; payouts: number; vatKnown: boolean; vat: number };
  orders: { order_number: string; created_at: string; total: number; payment_method: string; payment_status: string; vat_rate: number | null; vat_amount: number | null }[];
  stripeTransactions: { id: string; type: string; amount: number; fee: number; net: number; currency: string; created: number; description: string }[];
  stripeError: string | null;
  settings: { legal_name?: string; organization_number?: string; vat_rate?: number; timezone?: string; accountant_email?: string } | null;
};
const money = (n: number) => new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(n);
const dateValue = (d: Date) => [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");

export default function EconomyPage() {
  const router = useRouter();
  const now = new Date();
  const [preset, setPreset] = useState("month");
  const [from, setFrom] = useState(dateValue(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(dateValue(now));
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState("sales");
  const [showSettings, setShowSettings] = useState(false);\n  const [settingsForm, setSettingsForm] = useState({ legal_name: "", organization_number: "", accountant_email: "", vat_rate: "6", timezone: "Europe/Stockholm" });\n  const [settingsMessage, setSettingsMessage] = useState("");\n  const [savingSettings, setSavingSettings] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const { data: session } = await supabaseBrowser.auth.getSession();
    const token = session.session?.access_token;
    if (!token) { router.replace("/admin/login"); return; }
    const response = await fetch("/api/admin/economy?from=" + from + "&to=" + to, { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Rapporten kunde inte hämtas.");
    else setData(result);
    setLoading(false);
  }, [from, to, router]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!data?.settings) return;
    setSettingsForm({
      legal_name: data.settings.legal_name || "",
      organization_number: data.settings.organization_number || "",
      accountant_email: data.settings.accountant_email || "",
      vat_rate: String(data.settings.vat_rate ?? 6),
      timezone: data.settings.timezone || "Europe/Stockholm"
    });
  }, [data?.settings]);

  async function saveSettings() {
    setSavingSettings(true); setSettingsMessage("");
    const { data: session } = await supabaseBrowser.auth.getSession();
    const token = session.session?.access_token;
    if (!token) { router.replace("/admin/login"); return; }
    const response = await fetch("/api/admin/economy/settings", {
      method: "PUT",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ ...settingsForm, vat_rate: Number(settingsForm.vat_rate) })
    });
    const result = await response.json();
    if (!response.ok) setSettingsMessage(result.error || "Inställningarna kunde inte sparas.");
    else {
      setSettingsMessage("Inställningarna är sparade.");
      setData(current => current ? { ...current, settings: result.settings } : current);
    }
    setSavingSettings(false);
  }

  function choosePreset(value: string) {
    setPreset(value);
    const today = new Date();
    if (value === "today") { setFrom(dateValue(today)); setTo(dateValue(today)); }
    if (value === "week") { const d = new Date(today); d.setDate(d.getDate() - ((d.getDay()+6)%7)); setFrom(dateValue(d)); setTo(dateValue(today)); }
    if (value === "month") { setFrom(dateValue(new Date(today.getFullYear(), today.getMonth(), 1))); setTo(dateValue(today)); }
    if (value === "previous") { setFrom(dateValue(new Date(today.getFullYear(), today.getMonth()-1, 1))); setTo(dateValue(new Date(today.getFullYear(), today.getMonth(), 0))); }
  }

  const reportRows = useMemo(() => {
    if (!data) return [];
    if (report === "payments") return data.stripeTransactions.map(t => [new Date(t.created*1000).toISOString(), t.id, t.type, t.amount/100, t.fee/100, t.net/100, t.currency, t.description]);
    return data.orders.map(o => [o.created_at, o.order_number, o.payment_method, o.payment_status, o.total, o.vat_rate ?? "", o.vat_amount ?? ""]);
  }, [data, report]);

  function downloadCsv() {
    if (!data) return;
    const headers = report === "payments" ? ["Datum","Stripe-ID","Typ","Brutto","Avgift","Netto","Valuta","Beskrivning"] : ["Datum","Orderreferens","Betalmetod","Betalstatus","Belopp","Momssats","Momsbelopp"];
    const csv = [headers, ...reportRows].map(row => row.map(v => '"' + String(v ?? "").replace(/"/g,'""') + '"').join(";")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "tapco-" + report + "-" + from + "-" + to + ".csv"; a.click(); URL.revokeObjectURL(url);
  }

  const cards = [
    { id: "sales", title: "Försäljningsöversikt", desc: "Försäljning, moms, betalningsmetoder och återbetalningar.", formats: "PDF / CSV", icon: FileSpreadsheet },
    { id: "bookkeeping", title: "Bokföringsunderlag", desc: "Försäljningsjournal med orderreferenser, moms, betalningar och avgifter.", formats: "CSV / PDF", icon: FileText },
    { id: "payments", title: "Betalningsavstämning", desc: "Stripe-betalningar, avgifter, återbetalningar, nettobelopp och utbetalningar.", formats: "CSV / PDF", icon: RefreshCw }
  ];

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
      <div className="flex items-center gap-3"><button onClick={() => router.push("/admin")} className="rounded-lg border p-2"><ArrowLeft size={18}/></button><div><p className="text-xs font-bold uppercase tracking-wider text-orange-600">Tapco Pizza</p><h1 className="text-xl font-bold">Ekonomi</h1></div></div>
      <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"><Settings2 size={16}/> Inställningar</button>
    </div></header>
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-500">Period</p><h2 className="text-lg font-semibold">{from} – {to}</h2></div><div className="flex flex-wrap gap-2">{[["today","Idag"],["week","Denna vecka"],["month","Denna månad"],["previous","Föregående månad"]].map(([id,label])=><button key={id} onClick={()=>choosePreset(id)} className={"rounded-lg border px-3 py-2 text-sm "+(preset===id?"border-orange-500 bg-orange-50 text-orange-700":"bg-white")}>{label}</button>)}</div></div>
      <details className="text-sm"><summary className="cursor-pointer font-medium text-slate-600">Anpassa period</summary><div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"><label className="grid gap-1">Från<input type="date" value={from} onChange={e=>{setFrom(e.target.value);setPreset("custom")}} className="rounded-lg border p-2"/></label><label className="grid gap-1">Till<input type="date" value={to} min={from} onChange={e=>{setTo(e.target.value);setPreset("custom")}} className="rounded-lg border p-2"/></label><button onClick={()=>void load()} className="rounded-lg bg-slate-900 px-4 py-2 text-white">Uppdatera</button></div></details>
      {loading ? <div className="rounded-xl bg-white p-12 text-center text-slate-500">Hämtar ekonomidata…</div> : data && <>
        <div className="grid gap-3 sm:grid-cols-3">
          {[["Försäljning",money(data.summary.sales)],["Onlinebetalningar",money(data.summary.online)],["Återbetalningar",money(data.summary.refunds)]].map(([label,value])=><div key={label} className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight">{value}</p></div>)}
        </div>
        <div><h2 className="mb-3 text-lg font-bold">Dina rapporter</h2><div className="grid gap-3 md:grid-cols-3">{cards.map(card=>{const Icon=card.icon;return <button key={card.id} onClick={()=>setReport(card.id)} className={"rounded-xl border bg-white p-5 text-left shadow-sm transition "+(report===card.id?"border-orange-400 ring-2 ring-orange-100":"border-slate-200 hover:border-slate-300")}><div className="mb-4 flex items-center justify-between"><Icon className="text-orange-600" size={22}/><span className="text-xs text-slate-500">{card.formats}</span></div><h3 className="font-bold">{card.title}</h3><p className="mt-2 min-h-12 text-sm text-slate-600">{card.desc}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-700">Visa rapport <span>→</span></span></button>})}</div></div>
        {data.stripeError && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Stripe: {data.stripeError}</p>}
        <section className="rounded-xl border bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">{cards.find(c=>c.id===report)?.title}</h2><p className="text-sm text-slate-500">{data.orders.length} orderrader · {from} – {to}</p></div><div className="flex gap-2"><button onClick={downloadCsv} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><Download size={16}/> CSV</button><button onClick={()=>window.print()} className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"><FileText size={16}/> PDF / Skriv ut</button></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Försäljning</p><p className="text-xl font-bold">{money(data.summary.sales)}</p></div><div><p className="text-xs text-slate-500">Stripe-avgifter</p><p className="text-xl font-bold">{money(data.summary.stripeFees)}</p></div><div><p className="text-xs text-slate-500">Stripe netto</p><p className="text-xl font-bold">{money(data.summary.stripeNet)}</p></div><div><p className="text-xs text-slate-500">Utbetalningar till bank</p><p className="text-xl font-bold">{money(data.summary.payouts)}</p></div><div><p className="text-xs text-slate-500">Registrerad moms</p><p className="text-xl font-bold">{data.summary.vatKnown?money(data.summary.vat):"Ofullständig"}</p></div></div>
          {!data.summary.vatKnown && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Momsuppgifter saknas för en eller flera historiska ordrar. Rapporten markerar dem som ej registrerade i stället för att uppskatta moms.</p>}
          <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-slate-500"><tr>{report==="payments"?<><th className="py-2 pr-3">Datum</th><th className="py-2 pr-3">Stripe-ID</th><th className="py-2 pr-3">Typ</th><th className="py-2 pr-3">Valuta</th><th className="py-2 text-right">Brutto</th><th className="py-2 text-right">Avgift</th><th className="py-2 text-right">Netto</th></>:<><th className="py-2 pr-3">Datum</th><th className="py-2 pr-3">Orderreferens</th><th className="py-2 pr-3">Betalmetod</th><th className="py-2 pr-3">Status</th><th className="py-2 text-right">Belopp</th><th className="py-2 text-right">Moms</th></>}</tr></thead><tbody>{report==="payments"?data.stripeTransactions.slice(0,500).map(t=><tr key={t.id} className="border-b last:border-0"><td className="py-2 pr-3">{new Date(t.created*1000).toLocaleString("sv-SE")}</td><td className="py-2 pr-3 font-mono text-xs">{t.id}</td><td className="py-2 pr-3">{t.type}</td><td className="py-2 pr-3">{t.currency?.toUpperCase()}</td><td className="py-2 text-right">{money(t.amount/100)}</td><td className="py-2 text-right">{money(t.fee/100)}</td><td className="py-2 text-right">{money(t.net/100)}</td></tr>):data.orders.slice(0,500).map(o=><tr key={o.order_number} className="border-b last:border-0"><td className="py-2 pr-3">{new Date(o.created_at).toLocaleDateString("sv-SE")}</td><td className="py-2 pr-3">{o.order_number}</td><td className="py-2 pr-3">{o.payment_method==="online"?"Online":"På plats"}</td><td className="py-2 pr-3">{o.payment_status}</td><td className="py-2 text-right">{money(Number(o.total))}</td><td className="py-2 text-right">{o.vat_amount==null?"–":money(Number(o.vat_amount))}</td></tr>)}</tbody></table></div>
        </section>
      </>}
      {showSettings && <section className="rounded-xl border bg-white p-5"><h2 className="font-bold">Ekonomiinställningar</h2><p className="mt-1 text-sm text-slate-500">Uppgifterna används i kommande rapportunderlag. Ändrad momssats gäller endast nya ordrar.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">Företagsnamn<input value={settingsForm.legal_name} onChange={e=>setSettingsForm(s=>({...s,legal_name:e.target.value}))} className="rounded-lg border p-2" placeholder="Juridiskt företagsnamn"/></label>
        <label className="grid gap-1 text-sm">Organisationsnummer<input value={settingsForm.organization_number} onChange={e=>setSettingsForm(s=>({...s,organization_number:e.target.value}))} className="rounded-lg border p-2" placeholder="XXXXXX-XXXX"/></label>
        <label className="grid gap-1 text-sm">Momssats (%)<input type="number" min="0" max="100" step="0.01" value={settingsForm.vat_rate} onChange={e=>setSettingsForm(s=>({...s,vat_rate:e.target.value}))} className="rounded-lg border p-2"/></label>
        <label className="grid gap-1 text-sm">Redovisningskonsultens e-post<input type="email" value={settingsForm.accountant_email} onChange={e=>setSettingsForm(s=>({...s,accountant_email:e.target.value}))} className="rounded-lg border p-2" placeholder="namn@byra.se"/></label>
        <label className="grid gap-1 text-sm sm:col-span-2">Tidszon<select value={settingsForm.timezone} onChange={e=>setSettingsForm(s=>({...s,timezone:e.target.value}))} className="rounded-lg border p-2"><option value="Europe/Stockholm">Sverige – Europe/Stockholm</option><option value="Europe/Helsinki">Finland – Europe/Helsinki</option><option value="UTC">UTC</option></select></label>
      </div>{settingsMessage && <p role="status" className="mt-3 text-sm text-slate-600">{settingsMessage}</p>}<button disabled={savingSettings} onClick={()=>void saveSettings()} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{savingSettings?"Sparar…":"Spara inställningar"}</button></section>}
      <p className="text-xs text-slate-400">Underlaget bygger på orderdata och Stripe-transaktioner. Kontrollera moms- och redovisningsinställningar med er redovisningskonsult.</p>
    </section>
    <style jsx global>{`@media print { header, details, button, .text-xs.text-slate-400 { display:none!important } main { background:white!important } section { break-inside:avoid } }`}</style>
  </main>;
}
