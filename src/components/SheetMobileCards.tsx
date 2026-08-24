"use client";

import type { WorkEntry } from "@/lib/types";
import SignatureField from "@/components/SignatureField";

const DAYS = [
  { key: "monday", label: "2ª Feira" },
  { key: "tuesday", label: "3ª Feira" },
  { key: "wednesday", label: "4ª Feira" },
  { key: "thursday", label: "5ª Feira" },
  { key: "friday", label: "6ª Feira" },
  { key: "saturday", label: "Sábado" },
];

const SHIFT_LABEL: Record<string, string> = { morning: "Manhã", afternoon: "Tarde" };

const WORK_TYPES = [
  { value: "", label: "— Selecionar —" },
  { value: "new_installation", label: "Nova Instalação" },
  { value: "installation_continuation", label: "Continuação instalação" },
  { value: "preventive_maintenance", label: "Manutenção preventiva" },
  { value: "corrective_maintenance", label: "Manutenção corretiva" },
];

interface SheetMobileCardsProps {
  entries: WorkEntry[];
  weekDates: { key: string; label: string; date: string }[];
  /** key is "day-shift" e.g. "monday-morning" */
  upd: (key: string, f: keyof WorkEntry, v: string) => void;
  /** Set of "day-shift" keys marked as "não trabalhei" */
  skipped?: Set<string>;
  onToggleSkip?: (key: string) => void;
}

export default function SheetMobileCards({ entries, weekDates, upd, skipped, onToggleSkip }: SheetMobileCardsProps) {
  return (
    <div className="lg:hidden space-y-4">
      {entries.map((e, i) => {
        const dayLabel = DAYS.find(d => d.key === e.day)?.label || "";
        const date = e.date || weekDates.find(d => d.key === e.day)?.date || "";
        const key = `${e.day}-${e.shift}`;
        const isSkipped = skipped?.has(key) || false;
        return (
          <div key={key} className={`border border-brand-light/30 rounded-xl p-4 space-y-3 ${e.shift === "morning" && i > 0 ? "border-t-brand-gold border-t-2" : ""} ${isSkipped ? "opacity-50" : ""}`}>
            <h3 className="font-semibold text-brand-dark flex items-center gap-2">
              {dayLabel} — {date}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${e.shift === "morning" ? "bg-brand-gold/20 text-brand-dark" : "bg-brand-light/30 text-brand-soft"}`}>
                {SHIFT_LABEL[e.shift]}
              </span>
              {onToggleSkip && (
                <button
                  type="button"
                  onClick={() => onToggleSkip(key)}
                  className={`ml-auto text-[10px] px-2 py-1 rounded-full font-semibold transition-colors ${isSkipped ? "bg-brand-dark text-white" : "bg-brand-light/30 text-brand-soft"}`}
                >
                  {isSkipped ? "Não trabalhou" : "Não trabalhei"}
                </button>
              )}
            </h3>
            {isSkipped && (
              <p className="text-xs font-semibold text-brand-muted">Turno marcado como não trabalhado.</p>
            )}
            <input
              type="text"
              value={e.work_description}
              onChange={(ev) => upd(key, "work_description", ev.target.value)}
              className="input-field text-sm"
              placeholder="Trabalho a executar"
              disabled={isSkipped}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={e.work_type}
                onChange={(ev) => upd(key, "work_type", ev.target.value)}
                className="input-field text-sm"
                disabled={isSkipped}
              >
                {WORK_TYPES.map((wt) => (
                  <option key={wt.value} value={wt.value}>{wt.label}</option>
                ))}
              </select>
              <input
                type="date"
                value={date}
                onChange={(ev) => upd(key, "date", ev.target.value)}
                className="input-field text-sm"
                disabled={isSkipped}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-brand-muted">Início</label>
                <input
                  type="time"
                  value={e.start_time}
                  onChange={(ev) => upd(key, "start_time", ev.target.value)}
                  className="input-field text-sm"
                  disabled={isSkipped}
                />
              </div>
              <div>
                <label className="text-xs text-brand-muted">Fim</label>
                <input
                  type="time"
                  value={e.end_time}
                  onChange={(ev) => upd(key, "end_time", ev.target.value)}
                  className="input-field text-sm"
                  disabled={isSkipped}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={e.evaluation}
                onChange={(ev) => upd(key, "evaluation", ev.target.value)}
                className="input-field text-sm"
                placeholder="Avaliação"
                disabled={isSkipped}
              />
              <SignatureField
                value={e.signature}
                onChange={(v) => upd(key, "signature", v)}
              />
            </div>
            <input
              type="text"
              value={e.observations}
              onChange={(ev) => upd(key, "observations", ev.target.value)}
              className="input-field text-sm"
              placeholder="Observações"
              disabled={isSkipped}
            />
          </div>
        );
      })}
    </div>
  );
}
