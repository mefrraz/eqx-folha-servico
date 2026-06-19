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
      if (user) supabase.from("profiles").select("full_name").eq("id", user.id).single().then(({ data }) => {
        if (data) setUserName(data.full_name);
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <nav className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/worker/dashboard" className="flex items-center gap-2">
            <svg width="32" height="16" viewBox="0 0 48 24" className="shrink-0">
              <rect width="48" height="24" rx="4" fill="none" stroke="#F1C411" strokeWidth="2"/>
              <text x="24" y="17" textAnchor="middle" fill="#F1C411" fontSize="14" fontWeight="700" fontFamily="Inter,sans-serif">EQX</text>
            </svg>
            <span className="text-[10px] tracking-[.2em] uppercase text-white/40 hidden sm:inline">Folha de Serviço</span>
          </Link>
          <div className="flex items-center gap-4">
            {userName && <span className="text-sm text-white/70 hidden sm:block">{userName}</span>}
            <button onClick={async () => { await supabase.auth.signOut(); toast.success("Sessão terminada."); router.push("/auth/login"); }}
              className="text-xs text-white/40 hover:text-white transition-colors">
              Sair
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
