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

const WORK_TYPES = [
  { value: "", label: "— Selecionar —" },
  { value: "new_installation", label: "Nova Instalação" },
  { value: "installation_continuation", label: "Continuação instalação" },
  { value: "preventive_maintenance", label: "Manutenção preventiva" },
  { value: "corrective_maintenance", label: "Manutenção corretiva" },
];

interface SheetTableProps {
  entries: WorkEntry[];
  weekDates: { key: string; label: string; date: string }[];
  upd: (dk: string, f: keyof WorkEntry, v: string) => void;
}

export default function SheetTable({ entries, weekDates, upd }: SheetTableProps) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-light/30">
            <th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-20">Dia</th>
            <th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide">Trabalho a executar</th>
            <th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-36">Tipo</th>
            <th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-28">Data</th>
            <th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-24">Início</th>
            <th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-24">Fim</th>
            <th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-32">Avaliação</th>
            <th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-20">Rubrica</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={e.day} className="border-b border-brand-light/20 hover:bg-brand-gold/5">
              <td className="py-2 px-2 font-medium text-brand-dark">{DAYS[i].label}</td>
              <td className="py-2 px-2">
                <input
                  type="text"
                  value={e.work_description}
                  onChange={(ev) => upd(e.day, "work_description", ev.target.value)}
                  className="input-field !py-1.5 !px-2 text-xs"
                  placeholder="Descrever..."
                />
              </td>
              <td className="py-2 px-2">
                <select
                  value={e.work_type}
                  onChange={(ev) => upd(e.day, "work_type", ev.target.value)}
                  className="input-field !py-1.5 !px-2 text-xs"
                >
                  {WORK_TYPES.map((wt) => (
                    <option key={wt.value} value={wt.value}>{wt.label}</option>
                  ))}
                </select>
              </td>
              <td className="py-2 px-2">
                <input
                  type="date"
                  value={e.date || weekDates[i].date}
                  onChange={(ev) => upd(e.day, "date", ev.target.value)}
                  className="input-field !py-1.5 !px-2 text-xs"
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="time"
                  value={e.start_time}
                  onChange={(ev) => upd(e.day, "start_time", ev.target.value)}
                  className="input-field !py-1.5 !px-2 text-xs"
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="time"
                  value={e.end_time}
                  onChange={(ev) => upd(e.day, "end_time", ev.target.value)}
                  className="input-field !py-1.5 !px-2 text-xs"
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="text"
                  value={e.evaluation}
                  onChange={(ev) => upd(e.day, "evaluation", ev.target.value)}
                  className="input-field !py-1.5 !px-2 text-xs"
                  placeholder="Após trabalho"
                />
              </td>
              <td className="py-2 px-2">
                <SignatureField
                  value={e.signature}
                  onChange={(v) => upd(e.day, "signature", v)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
