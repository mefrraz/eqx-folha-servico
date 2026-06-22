"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { formatMinutes } from "@/lib/utils";

export default function WorkerSettingsClient({ userId, profile, totalMins, sheetsCount, projects }: { userId: string; profile: any; totalMins: number; sheetsCount: number; projects: any[] }) {
  const [name, setName] = useState(profile?.full_name || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    if (name !== profile?.full_name) await fetch("/api/update-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, full_name: name }) });
    if (password && password.length >= 6) {
      const r = await fetch("/api/update-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, password }) });
      if ((await r.json()).error) { toast.error("Erro ao mudar password."); setSaving(false); return; }
    }
    toast.success("Guardado!");
    setSaving(false); setPassword("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-brand-dark">O meu perfil</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center"><span className="stat-value">{formatMinutes(totalMins)}</span><span className="stat-label">Horas totais</span></div>
        <div className="stat-card text-center"><span className="stat-value">{sheetsCount}</span><span className="stat-label">Folhas</span></div>
        <div className="stat-card text-center"><span className="stat-value">{projects.length}</span><span className="stat-label">Obras</span></div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="card">
          <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase mb-3">Obras</h4>
          <div className="flex flex-wrap gap-2">
            {projects.map((p: any) => (
              <span key={p.id} className="text-sm bg-brand-gold/10 text-brand-dark font-medium px-3 py-2 rounded-xl">
                {p.name}
                {p.client?.name && <span className="block text-xs text-brand-muted font-normal mt-0.5">{p.client.name}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="card space-y-4">
        <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Editar dados</h4>
        <div><label className="label-field">Nome</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" /></div>
        <div><label className="label-field">Nova password (opcional)</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Deixar vazio = manter" minLength={6} /></div>
        <button onClick={handle} disabled={saving} className="btn-primary text-sm">{saving ? "A guardar…" : "Guardar"}</button>
      </div>
    </div>
  );
}
