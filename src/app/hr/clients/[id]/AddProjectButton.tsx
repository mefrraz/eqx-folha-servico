"use client";

import { useState } from "react";
import { addProject } from "@/app/hr/actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AddProjectButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handle = async () => {
    if (!name.trim()) { toast.error("Nome da obra é obrigatório."); return; }
    setSaving(true);
    const r = await addProject({ name: name.trim(), client_id: clientId, location: location || undefined });
    if (r.error) { toast.error(r.error); setSaving(false); return; }
    toast.success("Obra criada!");
    setOpen(false); setName(""); setLocation("");
    router.refresh();
  };

  return (<>
    <button onClick={() => setOpen(true)} className="btn-primary text-sm !py-2 !px-4">Adicionar obra</button>
    {open && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}><div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold text-brand-dark">Nova obra</h3><div><label className="label-field">Nome da obra</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Metro do Porto - Fase 2" /></div><div><label className="label-field">Localização (opcional)</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} className="input-field" placeholder="Porto, Portugal" /></div><div className="flex gap-3 justify-end"><button onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button><button onClick={handle} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">{saving ? "A criar…" : "Criar obra"}</button></div></div></div>)}
  </>);
}
