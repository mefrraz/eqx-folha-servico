"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
      if (user) {
        supabase.from("profiles").select("full_name").eq("id", user.id).single().then(({ data }) => {
          if (data) setUserName(data.full_name);
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão terminada.");
    router.push("/auth/login");
  };

  const isActive = (item: typeof NAV[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — desktop */}
      <aside className="w-56 bg-navy text-white flex-col shrink-0 hidden lg:flex">
        <Link href="/hr" className="block px-5 py-5 border-b border-white/10">
          <svg width="48" height="24" viewBox="0 0 48 24" className="mb-1">
            <rect width="48" height="24" rx="4" fill="none" stroke="#F1C411" strokeWidth="2"/>
            <text x="24" y="17" textAnchor="middle" fill="#F1C411" fontSize="14" fontWeight="700" fontFamily="Inter,sans-serif">EQX</text>
          </svg>
          <span className="text-[10px] tracking-[.2em] uppercase text-white/40">Administração</span>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item) ? "nav-link-active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-white/60 font-medium truncate">{userName}</p>
          <button onClick={handleLogout} className="text-xs text-white/30 hover:text-white/70 transition-colors mt-1">
            Terminar sessão
          </button>
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-navy text-white z-50 px-4 py-2.5 flex items-center justify-between">
        <Link href="/hr" className="font-bold text-gold text-sm tracking-wide">EQX</Link>
        <div className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs px-2 py-1 rounded ${isActive(item) ? "bg-white/15 text-gold" : "text-white/60"}`}
            >
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-xs text-white/30 hover:text-white/70 ml-2">Sair</button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#F7F7F7] min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 lg:pt-8 pt-14 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
