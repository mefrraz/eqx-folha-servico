"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const NAV = [
  { href: "/hr", label: "📊 Dashboard", exact: true },
  { href: "/hr/users", label: "👥 Utilizadores" },
  { href: "/hr/projects", label: "🏗️ Obras" },
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

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-primary-900 text-white flex flex-col shrink-0 hidden lg:flex">
        <div className="p-4 border-b border-primary-700">
          <Link href="/hr" className="text-lg font-bold tracking-tight">EQX RH</Link>
          <p className="text-xs text-primary-300 mt-0.5">Painel administração</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-primary-700 text-white" : "text-primary-200 hover:bg-primary-800 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-primary-700">
          <div className="text-xs text-primary-300 truncate mb-2">{userName}</div>
          <button onClick={handleLogout} className="text-xs text-primary-300 hover:text-white transition-colors w-full text-left">
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-primary-900 text-white z-50 px-4 py-2 flex items-center justify-between">
        <Link href="/hr" className="font-bold">EQX RH</Link>
        <div className="flex items-center gap-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs px-2 py-1 rounded ${pathname.startsWith(item.href) ? "bg-primary-700" : ""}`}
            >
              {item.label.replace(/[^\w\s]/g, "").trim()}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-xs text-primary-300 ml-2">Sair</button>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-gray-50 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 lg:pt-8 pt-14 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
