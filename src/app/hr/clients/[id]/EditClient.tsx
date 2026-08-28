"use client";

import { useState } from "react";
import { updateClient, deleteClient } from "@/app/hr/actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function EditClient({ client }: { client: any }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(client.name);
  const [logoUrl, setLogoUrl] = useState(client.logo_url || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handle = async () => {
    setSaving(true);
    const r = await updateClient(client.id, { name, logo_url: logoUrl || null });
    if (r.error) { toast.error(r.error); setSaving(false); return; }
    toast.success("Cliente atualizado!");
    setOpen(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Apagar o cliente "${client.name}"? As obras dele ficam sem cliente associado.`)) return;
    setSaving(true);
    const r = await deleteClient(client.id);
    if (r.error) { toast.error(r.error); setSaving(false); return; }
    toast.success("Cliente apagado.");
    router.push("/hr/clients");
  };

  return (<>
    <div className="flex gap-2">
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm !py-2 !px-4">Editar</button>
      <button onClick={handleDelete} className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:brightness-95 transition-all">Apagar</button>
    </div>
    {open && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}><div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold text-brand-dark">Editar cliente</h3><div><label className="label-field">Nome</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" /></div><div><label className="label-field">URL do logotipo</label><input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="input-field" placeholder="https://..." /></div><div className="flex gap-3 justify-end"><button onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button><button onClick={handle} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">{saving ? "A guardar…" : "Guardar"}</button></div></div></div>)}
  </>);
}
