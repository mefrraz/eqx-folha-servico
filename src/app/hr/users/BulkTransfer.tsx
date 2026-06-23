"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface BulkTransferProps {
  workers: { id: string; full_name: string }[];
}

export default function BulkTransfer({ workers }: BulkTransferProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const openModal = async () => {
    setOpen(true);
    const { data } = await supabase.from("projects").select("id,name,number,client:clients(name)").order("name");
    setProjects(data || []);
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === workers.length) setSelected(new Set());
    else setSelected(new Set(workers.map(w => w.id)));
  };

  const handle = async () => {
    if (selected.size === 0) { toast.error("Selecione pelo menos um trabalhador."); return; }
    if (!projectId) { toast.error("Selecione uma obra."); return; }
    setSaving(true);
    let done = 0;
    for (const wid of Array.from(selected)) {
      const { error } = await supabase.from("worker_projects").upsert({ worker_id: wid, project_id: projectId }, { onConflict: "worker_id,project_id" });
      if (!error) done++;
    }
    toast.success(`${done} trabalhador(es) atribuído(s)!`);
    setSaving(false); setOpen(false); setSelected(new Set()); setProjectId("");
  };

  if (workers.length === 0) return null;

  return (<>
    <button onClick={openModal} className="btn-secondary text-sm !py-2 !px-4">Transferir em massa</button>
    {open && (
      <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 overflow-y-auto py-8" onClick={() => setOpen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-brand-dark">Transferir trabalhadores</h3>

          <div>
            <label className="label-field">Obra de destino</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input-field">
              <option value="">— Selecionar obra —</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} {p.number ? `(${p.number})` : ""} {p.client?.name ? `— ${p.client.name}` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-field mb-0">Trabalhadores ({selected.size} selecionados)</label>
              <button onClick={selectAll} className="text-xs text-brand-gold hover:underline">
                {selected.size === workers.length ? "Limpar" : "Selecionar todos"}
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto border border-brand-light/30 rounded-xl divide-y divide-brand-light/20">
              {workers.map(w => (
                <label key={w.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-light/5">
                  <input type="checkbox" checked={selected.has(w.id)} onChange={() => toggle(w.id)} className="rounded" />
                  <span className="text-sm text-brand-dark">{w.full_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button>
            <button onClick={handle} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">{saving ? "A transferir…" : "Transferir"}</button>
          </div>
        </div>
      </div>
    )}
  </>);
}
