"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (data) setUserName(data.full_name);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão terminada.");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-primary-800 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/hr/dashboard" className="text-lg font-bold text-white">
              EQX Folhas
            </Link>
            <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full font-medium">
              RH / Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            {userName && (
              <span className="text-sm text-primary-200 hidden sm:block">
                {userName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-primary-200 hover:text-white transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
