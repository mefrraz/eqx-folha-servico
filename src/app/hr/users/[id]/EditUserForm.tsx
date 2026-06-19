"use client";

import { useState } from "react";
import { updateProfile, adminUpdateUser } from "@/app/hr/actions";
import toast from "react-hot-toast";

interface EditUserFormProps {
  userId: string;
  fullName: string;
}

export default function EditUserForm({ userId, fullName }: EditUserFormProps) {
  const [name, setName] = useState(fullName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    let hasError = false;

    if (name !== fullName) {
      const r = await updateProfile(userId, { full_name: name });
      if (r.error) { toast.error("Nome: " + r.error); hasError = true; }
    }

    if (email || password) {
      const data: Record<string, string> = {};
      if (email) data.email = email;
      if (password) data.password = password;
      const r = await adminUpdateUser(userId, data);
      if (r.error) { toast.error("Email/Password: " + r.error); hasError = true; }
    }

    if (!hasError) toast.success("Guardado!");
    setSaving(false);
    setPassword("");
    setEmail("");
  };

  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Editar utilizador</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label-field">Nome completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="label-field">Email (novo)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field text-sm"
            placeholder="Deixar vazio para manter"
          />
        </div>
        <div>
          <label className="label-field">Password (nova)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field text-sm"
            placeholder="Mín. 6 caracteres"
            minLength={6}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">
          {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </div>
    </div>
  );
}
