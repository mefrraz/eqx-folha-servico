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

function replaceVars(text: string, w: Worker) {
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
}

export default function ComposerModal({ workers, onClose }: { workers: Worker[]; onClose: () => void }) {
  const [step, setStep] = useState<"edit" | "recipients">("edit");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [savedSubject, setSavedSubject] = useState("");
  const [savedBody, setSavedBody] = useState("");

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const filtered = workers.filter(w =>
    w.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (w.email && w.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdvance = () => {
    if (!subject.trim()) { toast.error("Assunto obrigatorio."); return; }
    if (!body.trim()) { toast.error("Corpo do email obrigatorio."); return; }
    setSavedSubject(subject);
    setSavedBody(body);
    setStep("recipients");
  };

  const handleSend = async () => {
    if (selected.size === 0) { toast.error("Selecione pelo menos um trabalhador."); return; }
    if (!confirm(`Enviar email para ${selected.size} trabalhador(es)?`)) return;
    setSending(true);
    const res = await fetch("/api/send-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerIds: Array.from(selected), subject: savedSubject, body: savedBody }),
    });
    const data = await res.json();
    if (data.error) { toast.error(data.error); }
    else { toast.success(`Enviado: ${data.sent}. Falhas: ${data.failed}`); onClose(); }
    setSending(false);
  };

  const previewWorker = workers.find(w => selected.has(w.id)) || workers[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()} style={{height: "85vh"}}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-light/20 shrink-0">
          <h3 className="text-lg font-bold text-brand-dark">
            {step === "edit" ? "Novo email" : "Selecionar destinatarios"}
          </h3>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-dark font-bold text-lg leading-none">&times;</button>
        </div>

        {/* Step 1: Editor + Preview */}
        {step === "edit" && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            {/* Editor */}
            <div className="flex-1 p-5 space-y-4 overflow-y-auto border-r border-brand-light/20">
              <div className="flex items-center justify-between">
                <label className="label-field !mb-0">Assunto</label>
                <button onClick={() => setShowHelp(true)} className="text-brand-muted hover:text-brand-dark" title="Ajuda com variaveis">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </button>
              </div>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="input-field" placeholder="Assunto do email" />
              <label className="label-field">Corpo</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} className="input-field flex-1 min-h-[200px] font-mono text-xs" placeholder="Escreva o email... Use {variaveis}" style={{resize: "none"}} />
            </div>

            {/* Preview */}
            <div className="flex-1 p-5 overflow-y-auto bg-page">
              <p className="text-xs text-brand-soft mb-3 tracking-wide uppercase font-semibold">Pre-visualizacao</p>
              <div className="bg-white rounded-xl border border-brand-light/30 overflow-hidden">
                <div style={{ background: "#fff", padding: "12px 16px", textAlign: "center", borderBottom: "3px solid #F1C411" }}>
                  <span style={{ fontWeight: "bold", color: "#1a1a1a", fontSize: "14px" }}>EQX</span>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs text-brand-muted">Para: {previewWorker?.email || "—"}</p>
                  <p className="text-xs text-brand-muted">Assunto: {subject ? replaceVars(subject, previewWorker) : "—"}</p>
                  <div className="border-t border-brand-light/20 pt-3" />
                  <div className="text-sm text-brand-dark whitespace-pre-wrap">{body ? replaceVars(body, previewWorker) : "—"}</div>
                  <div className="border-t border-brand-light/20 pt-3" />
                  <p className="text-xs text-brand-muted italic">Enviado automaticamente pela plataforma EQX Folha de Servico.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Recipients */}
        {step === "recipients" && (
          <div className="flex-1 p-5 flex flex-col overflow-hidden min-h-0">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field shrink-0"
              placeholder="Pesquisar trabalhador..."
            />
            <p className="text-xs text-brand-soft mt-3 mb-2 shrink-0">{selected.size} selecionados</p>
            <div className="border border-brand-light/30 rounded-xl divide-y divide-brand-light/20 flex-1 overflow-y-auto min-h-0">
              {filtered.map(w => (
                <label key={w.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-brand-light/5">
                  <input type="checkbox" checked={selected.has(w.id)} onChange={() => toggle(w.id)} className="rounded shrink-0" />
                  <span className="text-sm text-brand-dark truncate">{w.full_name}</span>
                  {w.email && <span className="text-xs text-brand-muted ml-auto shrink-0 hidden sm:inline">{w.email}</span>}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-brand-light/20 shrink-0">
          <p className="text-xs text-brand-muted italic hidden sm:block">
            O email incluira o logo EQX e o rodape automatico.
          </p>
          {step === "edit" ? (
            <button onClick={handleAdvance} className="btn-primary text-sm !py-2 !px-6 ml-auto">Avancar</button>
          ) : (
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setStep("edit")} className="btn-secondary text-sm !py-2 !px-4">Voltar</button>
              <button onClick={handleSend} disabled={sending} className="btn-primary text-sm !py-2 !px-4">{sending ? "A enviar..." : `Enviar para ${selected.size}`}</button>
            </div>
          )}
        </div>
      </div>

      {/* Help overlay (floating, not inline) */}
      {showHelp && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-brand-dark">Variaveis disponiveis</h4>
              <button onClick={() => setShowHelp(false)} className="text-brand-muted hover:text-brand-dark font-bold">&times;</button>
            </div>
            <p className="text-xs text-brand-muted mb-3">Use <code className="bg-brand-light/20 px-1 rounded">{`{variavel}`}</code> no corpo do email. Serao substituidas pelos dados de cada trabalhador.</p>
            <div className="space-y-2">
              {VARIABLES.map(v => (
                <div key={v.key} className="flex items-center gap-2 text-xs">
                  <code className="bg-brand-gold/10 text-brand-dark px-1.5 py-0.5 rounded font-mono">{v.key}</code>
                  <span className="text-brand-soft">{v.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
