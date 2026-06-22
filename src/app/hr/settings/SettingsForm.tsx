"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function SettingsForm({ userId, fullName, userEmail }: { userId: string; fullName: string; userEmail: string }) {
  const [name, setName] = useState(fullName);
  const [email, setEmail] = useState(userEmail);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    if (name !== fullName) await fetch("/api/update-profile", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId,full_name:name}) });
    if (email !== userEmail || password) {
      const r = await fetch("/api/update-user", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId,email:email!==userEmail?email:null,password:password||null}) });
      if ((await r.json()).error) { toast.error("Erro ao atualizar."); setSaving(false); return; }
    }
    toast.success("Guardado!");
    setSaving(false); setPassword("");
  };

  return (
    <div className="card space-y-4">
      <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Editar</h4>
      <div><label className="label-field">Nome</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" /></div>
      <div><label className="label-field">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" /></div>
      <div><label className="label-field">Nova password (opcional)</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Deixar vazio = manter" minLength={6} /></div>
      <button onClick={handle} disabled={saving} className="btn-primary text-sm">{saving?"A guardar…":"Guardar"}</button>
    </div>
  );
}
