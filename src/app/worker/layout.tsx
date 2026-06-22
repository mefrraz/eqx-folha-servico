"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const NAV = [
  { href: "/worker/dashboard", label: "Início", icon: "🏠" },
  { href: "/worker/sheet/new", label: "Nova Folha", icon: "📝" },
  { href: "/worker/settings", label: "Definições", icon: "⚙️" },
];

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from("profiles").select("full_name").eq("id", user.id).single().then(({ data }) => { if (data) setUserName(data.full_name); });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isActive = (href: string) => pathname === href || (href !== "/worker/dashboard" && pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-page pb-16 lg:pb-0">
      {/* ── Top bar (desktop) ── */}
      <nav className="bg-white border-b border-brand-light/30 hidden lg:block">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/worker/dashboard" className="flex items-center gap-3">
              <img src="/eqx-logo.svg" alt="EQX" className="h-6 w-auto" />
              <span className="text-[10px] tracking-[.2em] uppercase text-brand-muted font-semibold">Folha de Serviço</span>
            </Link>
            <div className="flex items-center gap-1">
              {NAV.map(item => (
                <Link key={item.href} href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? "bg-brand-gold/20 text-brand-dark" : "text-brand-soft hover:text-brand-dark hover:bg-brand-light/10"}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {userName && <span className="text-sm text-brand-soft">{userName}</span>}
            <button onClick={async () => { await supabase.auth.signOut(); toast.success("Sessão terminada."); router.push("/auth/login"); }} className="text-xs text-brand-muted hover:text-brand-dark transition-colors">Sair</button>
          </div>
        </div>
      </nav>

      {/* ── Top bar (mobile) ── */}
      <nav className="bg-white border-b border-brand-light/30 lg:hidden">
        <div className="mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/worker/dashboard" className="flex items-center gap-2">
            <img src="/eqx-logo.svg" alt="EQX" className="h-5 w-auto" />
            <span className="text-[10px] tracking-[.2em] uppercase text-brand-muted font-semibold">EQX</span>
          </Link>
          <div className="flex items-center gap-3">
            {userName && <span className="text-xs text-brand-soft max-w-[120px] truncate">{userName}</span>}
            <button onClick={async () => { await supabase.auth.signOut(); toast.success("Sessão terminada."); router.push("/auth/login"); }} className="text-xs text-brand-muted hover:text-brand-dark transition-colors">Sair</button>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 lg:py-8">{children}</main>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-light/30 z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 transition-colors ${isActive(item.href) ? "text-brand-dark" : "text-brand-muted"}`}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
