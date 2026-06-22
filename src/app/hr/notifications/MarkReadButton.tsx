"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function MarkReadButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handle = async () => {
    setLoading(true);
    const supabase = (await import("@/lib/supabase/client")).createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    toast.success("Marcada como lida");
    router.refresh();
  };

  return (
    <button onClick={handle} disabled={loading} className="text-xs text-brand-gold font-medium hover:underline">
      {loading ? "…" : "Marcar lida"}
    </button>
  );
}
