"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) {
      toast.error(error.message?.includes("already registered") ? "Este email já está registado." : "Erro: " + error.message);
      setLoading(false); return;
    }
    if (!data.user) { toast.error("Erro ao criar conta."); setLoading(false); return; }

    if (data.session) {
      await supabase.from("profiles").update({ full_name: fullName }).eq("id", data.user.id);
      toast.success("Conta criada!");
      router.push("/"); router.refresh();
    } else {
      toast.success("Conta criada! Verifique o email antes de entrar.");
      router.push("/auth/login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <svg width="64" height="32" viewBox="0 0 48 24" className="mx-auto mb-4">
            <rect width="48" height="24" rx="4" fill="none" stroke="#F1C411" strokeWidth="2"/>
            <text x="24" y="17" textAnchor="middle" fill="#F1C411" fontSize="14" fontWeight="700" fontFamily="Inter,sans-serif">EQX</text>
          </svg>
          <h2 className="text-lg font-semibold text-white/90">Criar conta</h2>
          <p className="text-sm text-white/40 mt-1">Registo de trabalhador</p>
        </div>

        <form onSubmit={handleSignup} className="bg-white rounded p-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="label-field">Nome completo</label>
            <input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="input-field" placeholder="João Silva" />
          </div>
          <div>
            <label htmlFor="email" className="label-field">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field" placeholder="joao@eqx.pt" />
          </div>
          <div>
            <label htmlFor="password" className="label-field">Password</label>
            <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-field" placeholder="Mínimo 6 caracteres" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "A criar conta…" : "Criar conta"}
          </button>
          <p className="text-center text-xs text-steel">
            Já tem conta?{" "}
            <Link href="/auth/login" className="font-medium text-navy hover:text-gold transition-colors">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
