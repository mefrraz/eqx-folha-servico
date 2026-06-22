"use client";

import type { WorkEntry } from "@/lib/types";

const DAYS = [
  { key: "monday", label: "2ª Feira" },
  { key: "tuesday", label: "3ª Feira" },
  { key: "wednesday", label: "4ª Feira" },
  { key: "thursday", label: "5ª Feira" },
  { key: "friday", label: "6ª Feira" },
  { key: "saturday", label: "Sábado" },
];

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
  upd: (dk: string, f: keyof WorkEntry, v: string) => void;
}

export default function SheetMobileCards({ entries, weekDates, upd }: SheetMobileCardsProps) {
  return (
    <div className="lg:hidden space-y-4">
      {entries.map((e, i) => (
        <div key={e.day} className="border border-brand-light/30 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-brand-dark">{DAYS[i].label} — {weekDates[i].date}</h3>
          <input
            type="text"
            value={e.work_description}
            onChange={(ev) => upd(e.day, "work_description", ev.target.value)}
            className="input-field text-sm"
            placeholder="Trabalho a executar"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={e.work_type}
              onChange={(ev) => upd(e.day, "work_type", ev.target.value)}
              className="input-field text-sm"
            >
              {WORK_TYPES.map((wt) => (
                <option key={wt.value} value={wt.value}>{wt.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={e.date || weekDates[i].date}
              onChange={(ev) => upd(e.day, "date", ev.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-brand-muted">Início</label>
              <input
                type="time"
                value={e.start_time}
                onChange={(ev) => upd(e.day, "start_time", ev.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-brand-muted">Fim</label>
              <input
                type="time"
                value={e.end_time}
                onChange={(ev) => upd(e.day, "end_time", ev.target.value)}
                className="input-field text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={e.evaluation}
              onChange={(ev) => upd(e.day, "evaluation", ev.target.value)}
              className="input-field text-sm"
              placeholder="Avaliação"
            />
            <input
              type="text"
              value={e.signature}
              onChange={(ev) => upd(e.day, "signature", ev.target.value)}
              className="input-field text-sm"
              placeholder="Rubrica"
            />
          </div>
          <input
            type="text"
            value={e.observations}
            onChange={(ev) => upd(e.day, "observations", ev.target.value)}
            className="input-field text-sm"
            placeholder="Observações"
          />
        </div>
      ))}
    </div>
  );
}
