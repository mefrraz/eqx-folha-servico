"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import ComposerModal from "./ComposerModal";

interface Worker {
  id: string;
  full_name: string;
  email: string;
}

const PREDEFINED = [
  {
    id: "welcome",
    title: "Boas-vindas",
    trigger: "Quando um trabalhador cria conta",
    subject: "Bem-vindo a EQX",
    body: `Ola {name},

A sua conta na plataforma EQX Folha de Servico foi criada com sucesso.

Por favor, aceda a plataforma e selecione as obras em que esta a trabalhar.

Aceder: https://eqx-folha-servico.vercel.app`,
  },
  {
    id: "weekly_reminder",
    title: "Lembrete semanal",
    trigger: "Domingo as 9h — trabalhadores sem folha na semana anterior",
    subject: "EQX — Folha de servico pendente",
    body: `Ola {name},

A folha de servico da semana passada ainda nao foi submetida.

Por favor, submeta a sua folha o mais breve possivel.`,
  },
  {
    id: "weekly_stats",
    title: "Resumo semanal",
    trigger: "Domingo as 9h — para todos os trabalhadores",
    subject: "EQX — Resumo da semana",
    body: `Ola {name},

Resumo da semana {week_start} a {week_end}:

Total de horas: {total_hours}
Folhas submetidas: {sheets_count}

Continue o bom trabalho!`,
  },
];

export default function EmailClient({ workers }: { workers: Worker[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const startEdit = (id: string) => {
    const t = PREDEFINED.find(t => t.id === id);
    if (t) { setEditing(id); setEditSubject(t.subject); setEditBody(t.body); }
  };

  const saveEdit = async () => {
    // Save to DB — for now, store in localStorage
    localStorage.setItem(`email_template_${editing}_subject`, editSubject);
    localStorage.setItem(`email_template_${editing}_body`, editBody);
    toast.success("Template guardado.");
    setEditing(null);
  };

  return (<div className="space-y-8 max-w-5xl">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-brand-dark">Emails</h2>
        <p className="text-sm text-brand-soft mt-0.5">Gerir templates automaticos e enviar emails manuais</p>
      </div>
      <button onClick={() => setShowComposer(true)} className="btn-primary text-sm !py-2 !px-4">Novo email</button>
    </div>

    {/* Pre-defined templates */}
    <div>
      <h3 className="text-sm font-semibold text-brand-soft tracking-wide uppercase mb-3">Emails automaticos</h3>
      <p className="text-xs text-brand-muted mb-4">Estes emails sao enviados automaticamente. Pode editar o assunto e o corpo.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PREDEFINED.map(t => (
          <div key={t.id} className="card flex flex-col justify-between gap-3">
            <div>
              <p className="font-semibold text-brand-dark text-sm">{t.title}</p>
              <p className="text-xs text-brand-gold font-medium mt-0.5">{t.subject}</p>
              <p className="text-xs text-brand-muted mt-1">{t.trigger}</p>
            </div>
            <button onClick={() => startEdit(t.id)} className="btn-secondary text-xs !py-1.5">Editar</button>
          </div>
        ))}
      </div>
    </div>

    {/* Edit template modal */}
    {editing && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setEditing(null)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl mx-4 space-y-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-brand-dark">
            Editar — {PREDEFINED.find(t => t.id === editing)?.title}
          </h3>
          <p className="text-xs text-brand-muted">{PREDEFINED.find(t => t.id === editing)?.trigger}</p>
          <div>
            <label className="label-field">Assunto</label>
            <input type="text" value={editSubject} onChange={e => setEditSubject(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-field">Corpo</label>
            <textarea value={editBody} onChange={e => setEditBody(e.target.value)} className="input-field min-h-[150px] font-mono text-xs" />
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-brand-muted">
              Variaveis: <code className="bg-brand-light/20 px-1 rounded">{`{name}`}</code> <code className="bg-brand-light/20 px-1 rounded">{`{week_start}`}</code> <code className="bg-brand-light/20 px-1 rounded">{`{week_end}`}</code> <code className="bg-brand-light/20 px-1 rounded">{`{total_hours}`}</code> <code className="bg-brand-light/20 px-1 rounded">{`{sheets_count}`}</code> <code className="bg-brand-light/20 px-1 rounded">{`{email}`}</code> <code className="bg-brand-light/20 px-1 rounded">{`{obra_atual}`}</code>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost text-xs">Cancelar</button>
              <button onClick={saveEdit} className="btn-primary text-xs !py-1.5 !px-3">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Custom email composer */}
    {showComposer && (
      <ComposerModal
        workers={workers}
        onClose={() => setShowComposer(false)}
      />
    )}
  </div>);
}
