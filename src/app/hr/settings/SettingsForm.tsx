"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { adminUpdateUser } from "@/app/hr/actions";
import toast from "react-hot-toast";

export default function SettingsForm({ userId, fullName, userEmail }: { userId: string; fullName: string; userEmail: string }) {
  const [name, setName] = useState(fullName);
  const [email, setEmail] = useState(userEmail);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handle = async () => {
    setSaving(true);
    let err = false;

    // Update name
    if (name !== fullName) {
      const r = await fetch("/api/update-profile", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId,full_name:name}) });
      if ((await r.json()).error) { toast.error("Erro ao guardar nome."); err = true; }
    }

    // Update email (needs service_role via server action)
    if (email !== userEmail && email.includes("@")) {
      const r = await adminUpdateUser(userId, { email });
      if (r.error) { toast.error(r.error); err = true; }
    }

    // Update password (self = browser client, no service_role needed)
    if (password && password.length >= 6) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { toast.error("Erro ao mudar password: " + error.message); err = true; }
    }

    if (!err) toast.success("Guardado!");
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
