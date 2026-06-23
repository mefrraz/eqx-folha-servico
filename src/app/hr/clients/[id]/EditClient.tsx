"use client";

import { useState } from "react";
import { updateClient } from "@/app/hr/actions";
import toast from "react-hot-toast";

export default function EditClient({ client }: { client: any }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(client.name);
  const [logoUrl, setLogoUrl] = useState(client.logo_url || "");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    const r = await updateClient(client.id, { name, logo_url: logoUrl || null });
    if (r.error) { toast.error(r.error); setSaving(false); return; }
    toast.success("Cliente atualizado!");
    setOpen(false);
  };

  return (<>
    <button onClick={() => setOpen(true)} className="btn-secondary text-sm !py-2 !px-4">Editar</button>
    {open && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}><div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold text-brand-dark">Editar cliente</h3><div><label className="label-field">Nome</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" /></div><div><label className="label-field">URL do logotipo</label><input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="input-field" placeholder="https://..." /></div><div className="flex gap-3 justify-end"><button onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button><button onClick={handle} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">{saving ? "A guardar…" : "Guardar"}</button></div></div></div>)}
  </>);
}
