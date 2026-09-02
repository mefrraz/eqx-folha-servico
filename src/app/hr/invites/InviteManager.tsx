"use client";
import { useState } from "react";
import { createInvite, deleteInvite } from "@/app/hr/actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Invite {
  id: string;
  code: string;
  label?: string | null;
  expires_at?: string | null;
  used_by?: string | null;
  used_at?: string | null;
  role?: string;
  requires_approval?: boolean;
  project_ids?: string[] | null;
  used?: { full_name?: string; email?: string } | null;
}

function expiryInfo(invite: Invite) {
  if (invite.used_at) return { label: "Usado", cls: "bg-brand-light/30 text-brand-soft" };
  if (!invite.expires_at) return { label: "Sem prazo", cls: "bg-brand-gold/20 text-brand-dark" };
  const diff = new Date(invite.expires_at).getTime() - Date.now();
  if (diff < 0) return { label: "Expirado", cls: "bg-red-100 text-red-700" };
  if (diff < 7 * 24 * 3600 * 1000) return { label: "Expira em breve", cls: "bg-amber-100 text-amber-700" };
  return { label: "Válido", cls: "bg-success/20 text-green-700" };
}

export default function InviteManager({ invites, projects }: { invites: Invite[]; projects: { id: string; name: string; number?: string }[] }) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [role, setRole] = useState("worker");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [obraIds, setObraIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const toggleObra = (id: string) => {
    setObraIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleCreate = async () => {
    if (!code.trim()) { toast.error("Indique um código."); return; }
    setSaving(true);
    const r = await createInvite({ code, label, expires_at: expiresAt || null, role, requires_approval: requiresApproval, project_ids: Array.from(obraIds) });
    if (r.error) toast.error(r.error);
    else { toast.success("Convite criado!"); setCode(""); setLabel(""); setExpiresAt(""); setRole("worker"); setRequiresApproval(false); setObraIds(new Set()); router.refresh(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este convite?")) return;
    const r = await deleteInvite(id);
    if (r.error) toast.error(r.error);
    else { toast.success("Convite eliminado."); router.refresh(); }
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-brand-dark">Criar convite</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label-field">Código</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input-field" placeholder="EX: EQX2025" />
          </div>
          <div>
            <label className="label-field">Etiqueta (opcional)</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="input-field" placeholder="EX: Turma A" />
          </div>
          <div>
            <label className="label-field">Prazo (opcional)</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label-field">Papel da conta</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
              <option value="worker">Trabalhador</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <label className="flex items-center gap-2 pt-6 cursor-pointer">
            <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} className="rounded" />
            <span className="text-sm text-brand-soft">Requer aprovação das obras</span>
          </label>
        </div>
        <div>
          <label className="label-field">Obras do trabalhador (opcional — só estas lhe aparecerão)</label>
          {projects.length === 0 ? (
            <p className="text-xs text-brand-muted">Nenhuma obra registada. O convite ficará sem obras.</p>
          ) : (
            <div className="max-h-36 overflow-y-auto border border-brand-light/30 rounded-xl divide-y divide-brand-light/20 mt-1">
              {projects.map((p) => (
                <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-light/5">
                  <input type="checkbox" checked={obraIds.has(p.id)} onChange={() => toggleObra(p.id)} className="rounded" />
                  <span className="text-sm text-brand-dark">{p.name}</span>
                  {p.number && <span className="text-xs text-brand-gold font-mono">{p.number}</span>}
                </label>
              ))}
            </div>
          )}
          {obraIds.size > 0 && <p className="text-xs text-brand-muted mt-1">{obraIds.size} obra(s) selecionada(s) — atribuídas de imediato ao registar.</p>}
        </div>
        <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm !px-5 !py-2.5">
          {saving ? "A criar..." : "Criar convite"}
        </button>
      </div>

      {/* List */}
      <div className="card">
        <h3 className="text-sm font-semibold text-brand-dark mb-3">Convites ({invites.length})</h3>
        {invites.length === 0 ? (
          <p className="text-sm text-brand-muted py-4">Nenhum convite criado ainda.</p>
        ) : (
          <div className="space-y-2">
            {invites.map((inv) => {
              const info = expiryInfo(inv);
              return (
                <div key={inv.id} className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-brand-gold/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-semibold text-brand-dark">{inv.code}</span>
                    {inv.label && <span className="text-xs text-brand-soft truncate">{inv.label}</span>}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${info.cls}`}>{info.label}</span>
                    {inv.role === "admin" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-dark text-white">Admin</span>}
                    {inv.requires_approval && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Aprovação</span>}
                    {!!inv.project_ids?.length && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-dark">{inv.project_ids.length} obra(s)</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {inv.used ? (
                      <span className="text-xs text-brand-soft truncate max-w-[160px]">{inv.used.full_name || inv.used.email}</span>
                    ) : (
                      <span className="text-xs text-brand-muted">Não usado</span>
                    )}
                    <button onClick={() => handleDelete(inv.id)} className="text-xs text-brand-muted hover:text-red-600 transition-colors">Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
