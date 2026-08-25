"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface BulkActionsProps {
  workers: { id: string; full_name: string; email?: string }[];
  selected: Set<string>;
  onClear: () => void;
}

export default function BulkActions({ workers, selected, onClear }: BulkActionsProps) {
  const [mode, setMode] = useState<null | "project" | "delete" | "email">(null);
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const selectedWorkers = workers.filter((w) => selected.has(w.id));

  const openProject = async () => {
    setMode("project");
    const { data } = await supabase.from("projects").select("id,name,number,client:clients(name)").order("name");
    setProjects(data || []);
  };

  const assignProject = async () => {
    if (!projectId) { toast.error("Selecione uma obra."); return; }
    setSaving(true);
    let done = 0;
    for (const wid of Array.from(selected)) {
      const { error } = await supabase.from("worker_projects").upsert({ worker_id: wid, project_id: projectId, status: "approved" }, { onConflict: "worker_id,project_id" });
      if (!error) done++;
    }
    toast.success(`${done} trabalhador(es) atribuído(s)!`);
    setSaving(false); setMode(null); setProjectId(""); onClear(); router.refresh();
  };

  const deleteUsers = async () => {
    if (!adminEmail || !adminPassword) { toast.error("Indique as credenciais de admin."); return; }
    setSaving(true);
    let done = 0, failed = 0;
    for (const wid of Array.from(selected)) {
      const r = await fetch(`/api/users/${wid}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await r.json();
      if (data.success) done++; else failed++;
    }
    toast.success(`${done} eliminado(s).${failed ? ` ${failed} falharam.` : ""}`);
    setSaving(false); setMode(null); setAdminEmail(""); setAdminPassword(""); onClear(); router.refresh();
  };

  const sendEmail = async () => {
    if (!subject.trim() || !body.trim()) { toast.error("Preencha o assunto e o corpo."); return; }
    setSaving(true);
    const r = await fetch("/api/send-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerIds: Array.from(selected), subject, body }),
    });
    const data = await r.json();
    if (data.error) toast.error(data.error);
    else toast.success(`Email enviado a ${data.sent} trabalhador(es).`);
    setSaving(false); setMode(null); setSubject(""); setBody(""); onClear();
  };

  if (selected.size === 0) return null;

  return (<>
    <div className="flex items-center gap-2 flex-wrap bg-brand-gold/10 border border-brand-gold/30 rounded-xl px-3 py-2">
      <span className="text-sm font-semibold text-brand-dark">{selected.size} selecionado(s)</span>
      <button onClick={openProject} className="text-xs font-semibold bg-brand-dark text-white px-3 py-1.5 rounded-lg hover:brightness-110 transition-all">Atribuir obra</button>
      <button onClick={() => setMode("email")} className="text-xs font-semibold bg-brand-dark text-white px-3 py-1.5 rounded-lg hover:brightness-110 transition-all">Enviar email</button>
      <button onClick={() => setMode("delete")} className="text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:brightness-110 transition-all">Eliminar</button>
      <button onClick={onClear} className="text-xs text-brand-muted hover:text-brand-dark ml-auto">Cancelar</button>
    </div>

    {mode === "project" && (
      <Modal title="Atribuir obra" onClose={() => setMode(null)}>
        <label className="label-field">Obra de destino</label>
        <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input-field">
          <option value="">— Selecionar obra —</option>
          {projects.map((p: any) => (<option key={p.id} value={p.id}>{p.name} {p.number ? `(${p.number})` : ""}</option>))}
        </select>
        <p className="text-xs text-brand-muted mt-2">{selected.size} trabalhador(es) selecionado(s).</p>
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setMode(null)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button>
          <button onClick={assignProject} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">{saving ? "A atribuir…" : "Atribuir"}</button>
        </div>
      </Modal>
    )}

    {mode === "delete" && (
      <Modal title={`Eliminar ${selected.size} utilizador(es)`} onClose={() => setMode(null)}>
        <p className="text-sm text-brand-soft mb-3">Confirme com as credenciais de admin para eliminar os utilizadores selecionados.</p>
        <label className="label-field">Email de admin</label>
        <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="input-field" placeholder="admin@eqx.pt" />
        <label className="label-field">Password de admin</label>
        <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="input-field" placeholder="••••••••" />
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setMode(null)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button>
          <button onClick={deleteUsers} disabled={saving} className="bg-red-600 text-white !py-2 !px-4 text-sm rounded-xl font-semibold">{saving ? "A eliminar…" : "Eliminar"}</button>
        </div>
      </Modal>
    )}

    {mode === "email" && (
      <Modal title={`Enviar email a ${selected.size} trabalhador(es)`} onClose={() => setMode(null)}>
        <label className="label-field">Assunto</label>
        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="input-field" placeholder="Assunto do email" />
        <label className="label-field">Mensagem</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} className="input-field" placeholder="Escreva a mensagem... (pode usar {name}, {email})" />
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setMode(null)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button>
          <button onClick={sendEmail} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">{saving ? "A enviar…" : "Enviar"}</button>
        </div>
      </Modal>
    )}
  </>);
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 space-y-3" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-brand-dark">{title}</h3>
        {children}
      </div>
    </div>
  );
}
