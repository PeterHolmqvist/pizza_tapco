"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LoaderCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError("Inloggningen misslyckades. Kontrollera e-post och lösenord.");
      return;
    }
    const requestedPath = new URLSearchParams(window.location.search).get("next");
    const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/admin";
    router.replace(destination);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
          <LockKeyhole size={23} />
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900">Tapco Admin</h1>
        <p className="mt-1 mb-7 text-center text-sm text-slate-500">Logga in för att hantera beställningar</p>
        <label className="mb-1 block text-sm font-medium text-slate-700">E-post</label>
        <input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-orange-500" />
        <label className="mb-1 block text-sm font-medium text-slate-700">Lösenord</label>
        <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-orange-500" />
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
          {loading && <LoaderCircle size={18} className="animate-spin" />}
          {loading ? "Loggar in..." : "Logga in"}
        </button>
      </form>
    </main>
  );
}
