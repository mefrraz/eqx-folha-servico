"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ClearAllButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handle = async () => {
    if (!confirm("Limpar todas as notificações?")) return;
    setLoading(true);
    const supabase = (await import("@/lib/supabase/client")).createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);
    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success("Todas marcadas como lidas.");
      window.dispatchEvent(new CustomEvent("notif-cleared"));
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-xs text-brand-muted hover:text-brand-dark transition-colors"
    >
      {loading ? "..." : "Limpar todas"}
    </button>
  );
}
