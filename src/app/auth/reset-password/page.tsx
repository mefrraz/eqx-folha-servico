"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Check if this is a recovery flow (user clicked email link)
    const type = searchParams.get("type");
    if (type === "recovery") {
      setIsRecovery(true);
    }
  }, [searchParams]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Insira o email."); return; }
    setLoading(true);

    const appUrl = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Mínimo 6 caracteres."); return; }
    if (password !== confirm) { toast.error("Palavras-passe não coincidem."); return; }
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Palavra-passe alterada!");
    router.push("/");
    router.refresh();
  };

  if (isRecovery) {
    return (
      <form onSubmit={handleSetPassword} className="card space-y-4">
        <p className="text-sm text-brand-soft text-center">Defina a sua nova palavra-passe.</p>
        <div>
          <label htmlFor="password" className="label-field">Nova palavra-passe</label>
          <input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <label htmlFor="confirm" className="label-field">Confirmar</label>
          <input id="confirm" type="password" required minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)} className="input-field" placeholder="Repita a palavra-passe" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "A alterar..." : "Alterar palavra-passe"}
        </button>
      </form>
    );
  }

  if (sent) {
    return (
      <div className="card text-center space-y-3">
        <p className="text-brand-dark font-medium">Email enviado!</p>
        <p className="text-sm text-brand-soft">Verifique a sua caixa de entrada e siga o link para redefinir a palavra-passe.</p>
        <p className="text-xs text-brand-muted">Se não encontrar, verifique o spam.</p>
        <Link href="/auth/login" className="text-sm text-brand-gold hover:underline">Voltar ao login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendEmail} className="card space-y-4">
      <p className="text-sm text-brand-soft text-center">Insira o seu email para receber um link de recuperação.</p>
      <div>
        <label htmlFor="email" className="label-field">Email</label>
        <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="joao@eqx.pt" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "A enviar..." : "Enviar link de recuperação"}
      </button>
      <Link href="/auth/login" className="block text-center text-xs text-brand-muted hover:text-brand-gold">← Voltar ao login</Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Image src="/eqx-logo.png" alt="logo" width={134} height={40} className="h-10 w-auto mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-brand-dark">Recuperar password</h2>
          <p className="text-sm text-brand-soft mt-1">EQX Folha de Serviço</p>
        </div>
        <Suspense fallback={<div className="card text-center text-brand-muted text-sm">A carregar...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
