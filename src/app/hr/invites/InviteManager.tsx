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

export default function InviteManager({ invites }: { invites: Invite[] }) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!code.trim()) { toast.error("Indique um código."); return; }
    setSaving(true);
    const r = await createInvite({ code, label, expires_at: expiresAt || null });
    if (r.error) toast.error(r.error);
    else { toast.success("Convite criado!"); setCode(""); setLabel(""); setExpiresAt(""); router.refresh(); }
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
