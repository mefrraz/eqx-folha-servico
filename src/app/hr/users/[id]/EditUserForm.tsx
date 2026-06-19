"use client";

import { useState } from "react";
import { updateProfile, adminUpdateUser } from "@/app/hr/actions";
import toast from "react-hot-toast";

export default function EditUserForm({ userId, fullName }: { userId: string; fullName: string }) {
  const [name, setName] = useState(fullName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    let err = false;
    if (name !== fullName) { const r = await updateProfile(userId, { full_name: name }); if (r.error) { toast.error(r.error); err = true; } }
    if (email || password) {
      const d: Record<string, string> = {}; if (email) d.email = email; if (password) d.password = password;
      const r = await adminUpdateUser(userId, d); if (r.error) { toast.error(r.error); err = true; }
    }
    if (!err) toast.success("Guardado.");
    setSaving(false); setPassword(""); setEmail("");
  };

  return (
    <div className="card space-y-4">
      <h4 className="text-xs font-semibold text-steel tracking-wide uppercase">Editar credenciais</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label-field">Nome</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label-field">Novo email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="Manter actual" />
        </div>
        <div>
          <label className="label-field">Nova password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Mín. 6 caracteres" minLength={6} />
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm !px-4 !py-2">
          {saving ? "A guardar…" : "Guardar alterações"}
        </button>
      </div>
    </div>
  );
}
