"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const supabase = createClient();
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from("profiles").select("full_name").eq("id", user.id).single().then(({ data }) => { if (data) setUserName(data.full_name); });
    });
  }, []);

  return (
    <div className="min-h-screen bg-page">
      <nav className="bg-white border-b border-brand-light/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/worker/dashboard" className="flex items-center gap-3">
            <img src="/eqx-logo.svg" alt="EQX" className="h-6 w-auto" />
            <span className="text-[10px] tracking-[.2em] uppercase text-brand-muted font-semibold hidden sm:inline">Folha de Serviço</span>
          </Link>
          <div className="flex items-center gap-4">
            {userName && <span className="text-sm text-brand-soft hidden sm:block">{userName}</span>}
            <button onClick={async () => { await supabase.auth.signOut(); toast.success("Sessão terminada."); router.push("/auth/login"); }} className="text-xs text-brand-muted hover:text-brand-dark transition-colors">Sair</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
