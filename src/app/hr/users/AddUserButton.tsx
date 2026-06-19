"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AddUserButton() {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handle = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos."); return;
    }
    setSaving(true);
    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password }),
    });
    const data = await res.json();
    if (data.error) { toast.error(data.error); setSaving(false); return; }
    toast.success("Utilizador criado!");
    setOpen(false); setFullName(""); setEmail(""); setPassword("");
    router.refresh();
  };

  return (<>
    <button onClick={() => setOpen(true)} className="btn-primary text-sm !py-2 !px-4">Adicionar utilizador</button>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-brand-dark">Novo utilizador</h3>
          <div><label className="label-field">Nome completo</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" placeholder="João Silva" /></div>
          <div><label className="label-field">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="joao@eqx.pt" /></div>
          <div><label className="label-field">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Mín. 6 caracteres" minLength={6} /></div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button>
            <button onClick={handle} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">{saving ? "A criar…" : "Criar"}</button>
          </div>
        </div>
      </div>
    )}
  </>);
}
