"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ProjectSelector() {
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      // Check if worker and not yet onboarded
      supabase.from("profiles").select("role, onboarded").eq("id", user.id).single().then(({ data: profile }) => {
        if (profile && profile.role === "worker" && !profile.onboarded) {
          // Load available projects
          supabase.from("projects").select("id,name,number,client:clients(name)").order("name").then(({ data: pData }) => {
            setProjects(pData || []);
            setShow(true);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      });
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sessao expirada."); setSaving(false); return; }
    let done = 0;
    for (const pid of Array.from(selected)) {
      const { error } = await supabase.from("worker_projects").insert({ worker_id: user.id, project_id: pid });
      if (!error) done++;
      else console.error("[ProjectSelector] insert error:", error);
    }
    // Mark as onboarded
    await supabase.from("profiles").update({ onboarded: true }).eq("id", (await supabase.auth.getUser()).data.user?.id);
    toast.success(`${done} obra(s) selecionada(s)!`);
    setSaving(false); setShow(false);
    router.refresh();
  };

  // Don't show while checking
  if (loading || !show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-page">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl mx-4 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">Selecionar obras</h2>
          <p className="text-sm text-brand-soft mt-1">Indique as obras em que esta a trabalhar atualmente. Podera alterar esta selecao mais tarde nas Definicoes.</p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 text-brand-muted text-sm">Nenhuma obra disponivel. Contacte o administrador.</div>
        ) : (
          <div className="max-h-64 overflow-y-auto border border-brand-light/30 rounded-xl divide-y divide-brand-light/20">
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
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={handleSave} disabled={saving || projects.length === 0} className="btn-primary text-sm !px-6 !py-2.5">
            {saving ? "A guardar..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
