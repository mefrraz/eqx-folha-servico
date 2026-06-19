"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";

const NAV = [
  { href: "/hr", label: "Dashboard", exact: true },
  { href: "/hr/users", label: "Utilizadores" },
  { href: "/hr/projects", label: "Obras" },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from("profiles").select("full_name").eq("id", user.id).single().then(({ data }) => {
        if (data) setUserName(data.full_name);
      });
    });
  }, []);

  const isActive = (item: typeof NAV[0]) => item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-white border-r border-brand-light/30 flex-col shrink-0 hidden lg:flex">
        <Link href="/hr" className="flex items-center gap-3 px-5 py-5 border-b border-brand-light/30">
          <img src="/eqx-logo.svg" alt="EQX" className="h-7 w-auto" />
          <span className="text-[10px] tracking-[.2em] uppercase text-brand-muted font-semibold">Admin</span>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={isActive(item) ? "nav-link-active" : "nav-link"}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-brand-light/30">
          <p className="text-xs text-brand-soft font-medium truncate">{userName}</p>
          <button onClick={async () => { await supabase.auth.signOut(); toast.success("Sessão terminada."); router.push("/auth/login"); }}
            className="text-xs text-brand-muted hover:text-brand-dark transition-colors mt-1">
            Terminar sessão
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-brand-light/30 z-50 px-4 py-2.5 flex items-center justify-between">
        <Link href="/hr"><img src="/eqx-logo.svg" alt="EQX" className="h-5 w-auto" /></Link>
        <div className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`text-xs px-2 py-1 rounded-lg font-medium ${isActive(item) ? "bg-brand-gold/20 text-brand-dark" : "text-brand-soft"}`}>
              {item.label}
            </Link>
          ))}
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/auth/login"); }}
            className="text-xs text-brand-muted ml-2">Sair</button>
        </div>
      </div>

      <main className="flex-1 overflow-auto bg-page min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
