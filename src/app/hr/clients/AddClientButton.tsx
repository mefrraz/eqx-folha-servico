"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AddClientButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    const { error } = await supabase.from("clients").insert({ name: name.trim(), logo_url: logoUrl || null });
    if (error) { toast.error("Erro: " + error.message); setSaving(false); return; }
    toast.success("Cliente criado!");
    setOpen(false); setName(""); setLogoUrl("");
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-sm !py-2 !px-4">Adicionar cliente</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-brand-dark">Novo cliente</h3>
            <div><label className="label-field">Nome</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Nome da empresa" /></div>
            <div><label className="label-field">URL do logotipo (opcional)</label><input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="input-field" placeholder="https://..." /></div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">{saving ? "A criar…" : "Criar cliente"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
