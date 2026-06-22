"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import toast from "react-hot-toast";

const NAV = [
  { href: "/hr", label: "Dashboard", exact: true },
  { href: "/hr/users", label: "Utilizadores" },
  { href: "/hr/projects", label: "Obras" },
  { href: "/hr/clients", label: "Clientes" },
  { href: "/hr/reports", label: "Relatórios" },
  { href: "/hr/notifications", label: "Notificações", badge: true },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState("");
  const [notifCount, setNotifCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from("profiles").select("full_name").eq("id", user.id).single().then(({ data }) => {
        if (data) setUserName(data.full_name);
      });
    });
    // Fetch unread notification count
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false).then(({ count }) => {
      setNotifCount(count || 0);
    });
  }, []);

  const isActive = (item: typeof NAV[0]) => item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen flex">
      {/* Fixed sidebar */}
      <aside className="w-60 bg-white border-r border-brand-light/30 flex-col shrink-0 hidden lg:flex fixed top-0 left-0 h-full z-40">
        <Link href="/hr" className="flex items-center gap-3 px-5 py-5 border-b border-brand-light/30">
          <img src="/eqx-logo.svg" alt="EQX" className="h-6 w-auto" />
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={isActive(item) ? "nav-link-active" : "nav-link"}>
              <span className="flex items-center gap-2">
                {item.label}
                {item.badge && notifCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{notifCount}</span>
                )}
              </span>
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-brand-light/30 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-brand-soft font-medium truncate">{userName}</p>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/hr/settings" className="text-brand-muted hover:text-brand-dark transition-colors" title="Definições">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </Link>
            <button onClick={async () => { await supabase.auth.signOut(); toast.success("Sessão terminada."); router.push("/auth/login"); }}
              className="text-xs text-brand-muted hover:text-brand-dark transition-colors">Sair</button>
          </div>
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-brand-light/30 z-50 px-4 py-2.5 flex items-center justify-between">
        <Link href="/hr"><img src="/eqx-logo.svg" alt="EQX" className="h-5 w-auto" /></Link>
        <div className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`text-xs px-2 py-1 rounded-lg font-medium ${isActive(item) ? "bg-brand-gold/20 text-brand-dark" : "text-brand-soft"}`}>
              {item.label}
            </Link>
          ))}
          <Link href="/hr/settings" className="text-xs text-brand-muted px-1">⚙️</Link>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/auth/login"); }}
            className="text-xs text-brand-muted ml-2">Sair</button>
        </div>
      </div>

      {/* Main content — offset by sidebar width on desktop */}
      <main className="flex-1 bg-page min-h-screen lg:ml-60">
        <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
