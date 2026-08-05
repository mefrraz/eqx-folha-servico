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
}

export default function SheetMobileCards({ entries, weekDates, upd }: SheetMobileCardsProps) {
  return (
    <div className="lg:hidden space-y-4">
      {entries.map((e, i) => {
        const dayLabel = DAYS.find(d => d.key === e.day)?.label || "";
        const date = e.date || weekDates.find(d => d.key === e.day)?.date || "";
        return (
          <div key={`${e.day}-${e.shift}`} className={`border border-brand-light/30 rounded-xl p-4 space-y-3 ${e.shift === "morning" && i > 0 ? "border-t-brand-gold border-t-2" : ""}`}>
            <h3 className="font-semibold text-brand-dark flex items-center gap-2">
              {dayLabel} — {date}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${e.shift === "morning" ? "bg-brand-gold/20 text-brand-dark" : "bg-brand-light/30 text-brand-soft"}`}>
                {SHIFT_LABEL[e.shift]}
              </span>
            </h3>
            <input
              type="text"
              value={e.work_description}
              onChange={(ev) => upd(`${e.day}-${e.shift}`, "work_description", ev.target.value)}
              className="input-field text-sm"
              placeholder="Trabalho a executar"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={e.work_type}
                onChange={(ev) => upd(`${e.day}-${e.shift}`, "work_type", ev.target.value)}
                className="input-field text-sm"
              >
                {WORK_TYPES.map((wt) => (
                  <option key={wt.value} value={wt.value}>{wt.label}</option>
                ))}
              </select>
              <input
                type="date"
                value={date}
                onChange={(ev) => upd(`${e.day}-${e.shift}`, "date", ev.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-brand-muted">Início</label>
                <input
                  type="time"
                  value={e.start_time}
                  onChange={(ev) => upd(`${e.day}-${e.shift}`, "start_time", ev.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-brand-muted">Fim</label>
                <input
                  type="time"
                  value={e.end_time}
                  onChange={(ev) => upd(`${e.day}-${e.shift}`, "end_time", ev.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={e.evaluation}
                onChange={(ev) => upd(`${e.day}-${e.shift}`, "evaluation", ev.target.value)}
                className="input-field text-sm"
                placeholder="Avaliação"
              />
              <SignatureField
                value={e.signature}
                onChange={(v) => upd(`${e.day}-${e.shift}`, "signature", v)}
              />
            </div>
            <input
              type="text"
              value={e.observations}
              onChange={(ev) => upd(`${e.day}-${e.shift}`, "observations", ev.target.value)}
              className="input-field text-sm"
              placeholder="Observações"
            />
          </div>
        );
      })}
    </div>
  );
}
