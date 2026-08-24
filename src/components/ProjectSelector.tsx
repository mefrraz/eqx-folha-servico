"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ProjectSelector({ open, onClose }: { open?: boolean; onClose?: () => void }) {
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
      // Load available projects
      supabase.from("projects").select("id,name,number,client:clients(name)").order("name").then(({ data: pData }) => {
        setProjects(pData || []);
        // Load worker's current approved assignments
        supabase.from("worker_projects").select("project_id").eq("worker_id", user.id).eq("status", "approved").then(({ data: assigned }) => {
          setSelected(new Set((assigned || []).map((a: any) => a.project_id)));
          setLoading(false);
        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show when forced open, or during onboarding
  useEffect(() => {
    if (open) { setShow(true); return; }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("role, onboarded").eq("id", user.id).single().then(({ data: profile }) => {
        if (profile && profile.role === "worker" && !profile.onboarded) setShow(true);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleSave = async () => {
    if (selected.size === 0) { toast.error("Selecione pelo menos uma obra."); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sessão expirada."); setSaving(false); return; }

    // Check if this is the first selection (onboarding) or a change
    const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", user.id).single();
    const isFirstTime = !profile?.onboarded;
    const newStatus = isFirstTime ? "approved" : "pending";

    // Remove assignments the worker deselected
    const { data: current } = await supabase.from("worker_projects").select("project_id").eq("worker_id", user.id);
    const currentIds = new Set((current || []).map((c: any) => c.project_id));
    for (const cid of Array.from(currentIds)) {
      if (!selected.has(cid)) {
        await supabase.from("worker_projects").delete().eq("worker_id", user.id).eq("project_id", cid);
      }
    }

    // Insert newly selected (approved on first time, pending on change)
    let done = 0;
    for (const pid of Array.from(selected)) {
      if (currentIds.has(pid)) continue;
      const { error } = await supabase.from("worker_projects").insert({ worker_id: user.id, project_id: pid, status: newStatus });
      if (!error) done++;
      else console.error("[ProjectSelector] insert error:", error);
    }

    // Mark as onboarded
    await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
    // Notify admin only on project change (pending)
    if (!isFirstTime && done > 0) {
      await supabase.from("notifications").insert({
        message: `${user.email} pediu ${done} obra(s). Aprove em Obras → Pedidos.`,
      });
    }
    toast.success(isFirstTime ? `${done} obra(s) selecionada(s)!` : `${done} obra(s) aguardam aprovação do admin.`);
    setSaving(false); setShow(false);
    if (onClose) onClose();
    router.refresh();
  };

  // Don't show while checking
  if (loading || !show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-page">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl mx-4 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">Selecionar obras</h2>
          <p className="text-sm text-brand-soft mt-1">Indique as obras em que está a trabalhar. As novas obras ficam pendentes até o admin aprovar.</p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 text-brand-muted text-sm">Nenhuma obra disponível. Contacte o administrador.</div>
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
          {onClose && (
            <button onClick={() => { setShow(false); onClose(); }} className="btn-secondary text-sm !px-6 !py-2.5">Cancelar</button>
          )}
          <button onClick={handleSave} disabled={saving || projects.length === 0} className="btn-primary text-sm !px-6 !py-2.5">
            {saving ? "A guardar..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
