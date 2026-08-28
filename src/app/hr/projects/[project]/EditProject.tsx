"use client";
import { useState } from "react";
import { updateProject, deleteProject } from "@/app/hr/actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface EditProjectProps {
  project: { id: string; name: string; number?: string; client_id?: string; location?: string };
  clients: { id: string; name: string }[];
}

export default function EditProject({ project, clients }: EditProjectProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name || "");
  const [number, setNumber] = useState(project.number || "");
  const [clientId, setClientId] = useState(project.client_id || "");
  const [location, setLocation] = useState(project.location || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim()) { toast.error("O nome é obrigatório."); return; }
    setSaving(true);
    const r = await updateProject(project.id, {
      name: name.trim(),
      number: number.trim() || undefined,
      client_id: clientId || null,
      location: location.trim() || undefined,
    });
    if (r.error) toast.error(r.error);
    else { toast.success("Obra atualizada!"); setOpen(false); router.refresh(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Apagar a obra "${project.name}"? As folhas existentes mantêm o histórico, mas ficam sem obra associada.`)) return;
    setSaving(true);
    const r = await deleteProject(project.id);
    if (r.error) { toast.error(r.error); setSaving(false); return; }
    toast.success("Obra apagada.");
    router.push("/hr/projects");
  };

  return (<>
    <div className="flex gap-2">
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs !py-1.5 !px-3">Editar</button>
      <button onClick={handleDelete} className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:brightness-95 transition-all">Apagar</button>
    </div>

    {open && (
      <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 overflow-y-auto py-8" onClick={() => setOpen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 space-y-3" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-brand-dark">Editar obra</h3>
          <div><label className="label-field">Nome</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" /></div>
          <div><label className="label-field">Nº da obra (opcional)</label><input type="text" value={number} onChange={e => setNumber(e.target.value)} className="input-field" /></div>
          <div>
            <label className="label-field">Cliente (opcional)</label>
            <select value={clientId || ""} onChange={e => setClientId(e.target.value)} className="input-field">
              <option value="">— Sem cliente —</option>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div><label className="label-field">Localização (opcional)</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} className="input-field" /></div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">{saving ? "A guardar..." : "Guardar"}</button>
          </div>
        </div>
      </div>
    )}
  </>);
}