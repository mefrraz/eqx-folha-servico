"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface Worker {
  id: string;
  full_name: string;
  email: string;
}

const VARIABLES = [
  { key: "{name}", desc: "Nome do trabalhador" },
  { key: "{email}", desc: "Email do trabalhador" },
  { key: "{week_start}", desc: "Segunda-feira da semana atual" },
  { key: "{week_end}", desc: "Sabado da semana atual" },
  { key: "{total_hours}", desc: "Total de horas do trabalhador" },
  { key: "{sheets_count}", desc: "Numero de folhas submetidas" },
  { key: "{obra_atual}", desc: "Obra atual atribuida" },
];

const DEFAULT_TEMPLATE = `Ola {name},

Informamos que a sua folha de servico da semana {week_start} a {week_end} precisa de ser submetida.

Total de horas registadas ate agora: {total_hours}
Folhas submetidas este mes: {sheets_count}

Por favor, aceda a plataforma e submeta a sua folha o mais breve possivel.

Obrigado,
EQX`;

export default function EmailClient({ workers }: { workers: Worker[] }) {
  const [subject, setSubject] = useState("EQX — Folha de Servico");
  const [body, setBody] = useState(DEFAULT_TEMPLATE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewWorker, setPreviewWorker] = useState<Worker | null>(null);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === workers.length) setSelected(new Set());
    else setSelected(new Set(workers.map(w => w.id)));
  };

  const replaceVars = (text: string, w: Worker) => {
    const now = new Date();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const sat = new Date(mon);
    sat.setDate(mon.getDate() + 5);

    return text
      .replace(/{name}/g, w.full_name)
      .replace(/{email}/g, w.email)
      .replace(/{week_start}/g, mon.toLocaleDateString("pt"))
      .replace(/{week_end}/g, sat.toLocaleDateString("pt"))
      .replace(/{total_hours}/g, "—")
      .replace(/{sheets_count}/g, "—")
      .replace(/{obra_atual}/g, "—");
  };

  const handlePreview = () => {
    const first = workers.find(w => selected.has(w.id));
    if (!first) { toast.error("Selecione um trabalhador para pre-visualizar."); return; }
    setPreviewWorker(first);
    setShowPreview(true);
  };

  const handleSend = async () => {
    if (selected.size === 0) { toast.error("Selecione pelo menos um trabalhador."); return; }
    if (!subject.trim()) { toast.error("Assunto obrigatorio."); return; }
    if (!body.trim()) { toast.error("Corpo do email obrigatorio."); return; }
    if (!confirm(`Enviar email para ${selected.size} trabalhador(es)?`)) return;

    setSending(true);
    const res = await fetch("/api/send-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workerIds: Array.from(selected),
        subject: subject.trim(),
        body: body.trim(),
      }),
    });
    const data = await res.json();
    if (data.error) { toast.error(data.error); }
    else { toast.success(`Enviado para ${data.sent} trabalhador(es). Falhas: ${data.failed}`); }
    setSending(false);
  };

  return (<div className="space-y-6 max-w-4xl">
    <div>
      <h2 className="text-lg font-bold text-brand-dark">Emails</h2>
      <p className="text-sm text-brand-soft mt-0.5">Enviar emails personalizados aos trabalhadores</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-4">
        <div className="card space-y-4">
          <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Email</h4>
          <div>
            <label className="label-field">Assunto</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="input-field" placeholder="Assunto do email" />
          </div>
          <div>
            <label className="label-field">Corpo</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} className="input-field min-h-[200px] font-mono text-xs" placeholder="Escreva o email..." />
          </div>
        </div>

        {/* Variables doc */}
        <div className="card !p-4">
          <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase mb-2">Variaveis disponiveis</h4>
          <p className="text-xs text-brand-muted mb-2">Use <code className="bg-brand-light/20 px-1 rounded">{`{variavel}`}</code> no corpo do email — serao substituidas por cada trabalhador.</p>
          <div className="space-y-1">
            {VARIABLES.map(v => (
              <div key={v.key} className="flex items-center gap-2 text-xs">
                <code className="bg-brand-gold/10 text-brand-dark px-1.5 py-0.5 rounded font-mono">{v.key}</code>
                <span className="text-brand-soft">{v.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recipients + actions */}
      <div className="space-y-4">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Destinatarios ({selected.size})</h4>
            <button onClick={selectAll} className="text-xs text-brand-gold hover:underline">{selected.size === workers.length ? "Limpar" : "Todos"}</button>
          </div>
          <div className="max-h-64 overflow-y-auto border border-brand-light/30 rounded-xl divide-y divide-brand-light/20">
            {workers.filter(w => w.email).map(w => (
              <label key={w.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-light/5">
                <input type="checkbox" checked={selected.has(w.id)} onChange={() => toggle(w.id)} className="rounded" />
                <div>
                  <span className="text-sm text-brand-dark">{w.full_name}</span>
                  <span className="text-xs text-brand-muted ml-2">{w.email}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handlePreview} className="btn-secondary text-sm !py-2 !px-4 flex-1">Pre-visualizar</button>
          <button onClick={handleSend} disabled={sending} className="btn-primary text-sm !py-2 !px-4 flex-1">{sending ? "A enviar..." : "Enviar"}</button>
        </div>

        {/* Auto footer notice */}
        <div className="card !p-3 bg-brand-gold/5 border-brand-gold/20">
          <p className="text-xs text-brand-soft">
            Todos os emails enviados incluem no rodape: <em>&quot;Enviado automaticamente pela plataforma EQX Folha de Servico.&quot;</em>
          </p>
        </div>
      </div>
    </div>

    {/* Preview modal */}
    {showPreview && previewWorker && (
      <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 overflow-y-auto py-8" onClick={() => setShowPreview(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 my-auto" onClick={e => e.stopPropagation()}>
          <div style={{ background: "#F1C411", padding: "16px 24px", borderRadius: "14px 14px 0 0", textAlign: "center" }}>
            <span style={{ fontWeight: "bold", color: "#1a1a1a", fontSize: "16px" }}>EQX</span>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-xs text-brand-muted">Para: {previewWorker.email}</p>
            <p className="text-xs text-brand-muted">Assunto: {replaceVars(subject, previewWorker)}</p>
            <div className="border-t border-brand-light/20 pt-3" />
            <div className="text-sm text-brand-dark whitespace-pre-wrap">{replaceVars(body, previewWorker)}</div>
            <div className="border-t border-brand-light/20 pt-3" />
            <p className="text-xs text-brand-muted italic">Enviado automaticamente pela plataforma EQX Folha de Servico.</p>
          </div>
          <div className="p-4 border-t border-brand-light/20 flex justify-end">
            <button onClick={() => setShowPreview(false)} className="btn-ghost text-xs">Fechar</button>
          </div>
        </div>
      </div>
    )}
  </div>);
}
