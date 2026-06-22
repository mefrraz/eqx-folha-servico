"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const CACHE_KEY = "eqx_admin_creds";
const CACHE_DURATION = 5 * 60 * 1000;

function getCachedCreds(): { email: string; password: string } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.ts < CACHE_DURATION) return { email: data.email, password: data.pw };
    localStorage.removeItem(CACHE_KEY);
  } catch {}
  return null;
}

function setCachedCreds(email: string, password: string) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ email, password: password, ts: Date.now() }));
}

export default function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [step, setStep] = useState<"hidden" | "warn" | "confirm">("hidden");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const creds = getCachedCreds();
    if (creds) { setEmail(creds.email); setPassword(creds.password); }
  }, []);

  const handleDelete = async () => {
    if (!email.trim() || !password.trim()) { toast.error("Email e password obrigatórios."); return; }
    setLoading(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json();
    if (data.error) { toast.error(data.error); setLoading(false); return; }
    setCachedCreds(email.trim(), password);
    toast.success("Utilizador eliminado.");
    router.push("/hr/users");
    router.refresh();
  };

  return (
    <div className="mt-4 pt-4 border-t border-brand-light/30">
      {step === "hidden" && (
        <button onClick={() => setStep("warn")} className="text-xs text-brand-muted hover:text-red-500 transition-colors">Eliminar utilizador</button>
      )}
      {step === "warn" && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-red-600">⚠️ Ação irreversível</p>
          <p className="text-xs text-brand-soft">Vai eliminar <strong>{userName}</strong> e todas as suas folhas.</p>
          <div className="flex gap-2">
            <button onClick={() => setStep("hidden")} className="btn-secondary text-xs !py-1.5 !px-3">Cancelar</button>
            <button onClick={() => setStep("confirm")} className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-red-600 transition-colors">Continuar</button>
          </div>
        </div>
      )}
      {step === "confirm" && (
        <div className="space-y-3">
          <p className="text-xs text-brand-soft">Autentique-se como admin:</p>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field text-sm" placeholder="Email de admin" autoFocus />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field text-sm" placeholder="Password de admin" />
          <div className="flex gap-2">
            <button onClick={() => setStep("hidden")} className="btn-secondary text-xs !py-1.5 !px-3">Cancelar</button>
            <button onClick={handleDelete} disabled={loading} className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-red-600 disabled:opacity-40">{loading ? "…" : `Eliminar ${userName}`}</button>
          </div>
        </div>
      )}
    </div>
  );
}
