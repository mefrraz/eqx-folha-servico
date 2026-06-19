"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error("Email ou password incorretos."); setLoading(false); return; }
    toast.success("Autenticado.");
    router.push("/"); router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <svg width="64" height="32" viewBox="0 0 48 24" className="mx-auto mb-4">
            <rect width="48" height="24" rx="4" fill="none" stroke="#F1C411" strokeWidth="2"/>
            <text x="24" y="17" textAnchor="middle" fill="#F1C411" fontSize="14" fontWeight="700" fontFamily="Inter,sans-serif">EQX</text>
          </svg>
          <h2 className="text-lg font-semibold text-white/90">Folha de Serviço</h2>
          <p className="text-sm text-white/40 mt-1">Inicie sessão para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded p-6 space-y-4">
          <div>
            <label htmlFor="email" className="label-field">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field" placeholder="nome@eqx.pt" />
          </div>
          <div>
            <label htmlFor="password" className="label-field">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-field" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "A entrar…" : "Entrar"}
          </button>
          <p className="text-center text-xs text-steel">
            Sem conta?{" "}
            <Link href="/auth/signup" className="font-medium text-navy hover:text-gold transition-colors">Criar conta</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
