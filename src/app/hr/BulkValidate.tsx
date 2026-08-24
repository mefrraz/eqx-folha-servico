"use client";
import { useState } from "react";
import { markManyAsReviewed } from "@/app/hr/actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface BulkValidateProps {
  sheets: { id: string; worker_name: string; hours: string }[];
}

export default function BulkValidate({ sheets }: BulkValidateProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === sheets.length ? new Set() : new Set(sheets.map((s) => s.id))));
  };

  const handleValidate = async () => {
    if (selected.size === 0) { toast.error("Selecione pelo menos uma folha."); return; }
    setLoading(true);
    const r = await markManyAsReviewed(Array.from(selected));
    if (r.error) toast.error(r.error);
    else { toast.success(`${r.count} folha(s) validadas!`); setSelected(new Set()); router.refresh(); }
    setLoading(false);
  };

  if (sheets.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Validar em massa</h4>
        <button type="button" onClick={toggleAll} className="text-xs text-brand-soft hover:text-brand-dark font-medium">
          {selected.size === sheets.length ? "Desmarcar todas" : "Selecionar todas"}
        </button>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {sheets.map((s) => (
          <label key={s.id} className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-brand-gold/5 transition-colors cursor-pointer">
            <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="rounded" />
            <span className="text-sm text-brand-dark font-medium flex-1">{s.worker_name}</span>
            <span className="text-xs font-mono text-brand-soft">{s.hours}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={handleValidate}
        disabled={loading || selected.size === 0}
        className="btn-primary text-sm mt-3 !px-5 !py-2.5"
      >
        {loading ? "A validar..." : `Validar ${selected.size > 0 ? `(${selected.size})` : ""}`}
      </button>
    </div>
  );
}
