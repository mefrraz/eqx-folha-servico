"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function ProjectSelector() {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [hasAssignments, setHasAssignments] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Check if worker already has project assignments
    supabase.from("worker_projects").select("project_id").then(({ data }) => {
      if (data && data.length > 0) {
        setHasAssignments(true);
      } else {
        setHasAssignments(false);
        // Pre-load available projects
        supabase.from("projects").select("id,name,number,client:clients(name)").order("name").then(({ data: pData }) => {
          setProjects(pData || []);
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleSave = async () => {
    if (selected.size === 0) { toast.error("Selecione pelo menos uma obra."); return; }
    setSaving(true);
    let done = 0;
    for (const pid of Array.from(selected)) {
      const { error } = await supabase.from("worker_projects").insert({ project_id: pid });
      if (!error) done++;
    }
    toast.success(`${done} obra(s) selecionada(s)!`);
    setSaving(false); setOpen(false); setHasAssignments(true);
  };

  // Don't show anything while checking
  if (hasAssignments === null) return null;

  // Already has assignments — show nothing
  if (hasAssignments === true) return null;

  // No assignments — show prompt
  return (<>
    <div className="card border-2 border-brand-gold/30 bg-brand-gold/5">
      <div className="text-center py-4">
        <p className="text-sm text-brand-dark font-semibold mb-1">🎯 Bem-vindo à EQX!</p>
        <p className="text-xs text-brand-soft mb-3">Selecione as obras em que está a trabalhar neste momento.</p>
        <button onClick={() => setOpen(true)} className="btn-primary text-sm !py-2 !px-6">Selecionar obras</button>
      </div>
    </div>

    {open && (
      <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 overflow-y-auto py-8" onClick={() => setOpen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-brand-dark">Selecionar obras</h3>
          <p className="text-sm text-brand-soft">Escolha as obras em que está atualmente a trabalhar.</p>

          <div className="max-h-80 overflow-y-auto border border-brand-light/30 rounded-xl divide-y divide-brand-light/20">
            {projects.map((p: any) => (
              <label key={p.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-brand-light/5">
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="rounded" />
                <div>
                  <span className="text-sm text-brand-dark font-medium">{p.name}</span>
                  {p.number && <span className="text-xs text-brand-gold font-mono ml-2">{p.number}</span>}
                  {p.client?.name && <span className="block text-xs text-brand-muted">{p.client.name}</span>}
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">{saving ? "A guardar…" : "Confirmar"}</button>
          </div>
        </div>
      </div>
    )}
  </>);
}
