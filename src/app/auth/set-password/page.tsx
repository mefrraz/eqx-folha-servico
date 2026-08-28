"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import toast from "react-hot-toast";

function SetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error("Token em falta."); return; }
    if (password.length < 6) { toast.error("Mínimo 6 caracteres."); return; }
    if (password !== confirm) { toast.error("Palavras-passe não coincidem."); return; }
    setLoading(true);

    const res = await fetch("/api/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (data.error) { toast.error(data.error); setLoading(false); return; }

    toast.success("Palavra-passe definida! A fazer login...");

    // Auto-login
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password,
    });
    if (error) { toast.error("Conta criada mas login falhou. Tente fazer login manualmente."); router.push("/auth/login"); return; }

    router.push("/");
    router.refresh();
  };

  if (!token) {
    return (
      <div className="card text-center">
        <p className="text-brand-soft">Link inválido ou expirado.</p>
        <p className="text-xs text-brand-muted mt-2">Contacte o administrador para receber um novo convite.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handle} className="card space-y-4">
      <p className="text-sm text-brand-soft text-center">Defina a sua palavra-passe para aceder à plataforma.</p>
      <div>
        <label htmlFor="password" className="label-field">Palavra-passe</label>
        <input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Mínimo 6 caracteres" />
      </div>
      <div>
        <label htmlFor="confirm" className="label-field">Confirmar palavra-passe</label>
        <input id="confirm" type="password" required minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)} className="input-field" placeholder="Repita a palavra-passe" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "A definir..." : "Definir palavra-passe"}
      </button>
    </form>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Image src="/eqx-logo.png" alt="logo" width={134} height={40} className="h-10 w-auto mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-brand-dark">Bem-vindo</h2>
          <p className="text-sm text-brand-soft mt-1">Ativar conta EQX</p>
        </div>
        <Suspense fallback={<div className="card text-center text-brand-muted text-sm">A carregar...</div>}>
          <SetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
