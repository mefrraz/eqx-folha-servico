"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { format, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import toast from "react-hot-toast";

// ---- Types ----
interface WorkEntry {
  id?: string;
  day: string;
  work_description: string;
  work_type: string;
  date: string;
  evaluation: string;
  signature: string;
  observations: string;
  start_time: string;
  end_time: string;
}

interface WorkSheet {
  id?: string;
  client: string;
  work_number: string;
  week_start: string;
  week_end: string;
  status: string;
  entries: WorkEntry[];
}

// ---- Constants ----
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

// ---- Helpers ----
function emptyEntry(day: string): WorkEntry {
  return {
    day,
    work_description: "",
    work_type: "",
    date: "",
    evaluation: "",
    signature: "",
    observations: "",
    start_time: "",
    end_time: "",
  };
}

function getWeekDates(weekStart: Date) {
  return DAYS.map((d, i) => ({
    ...d,
    date: format(addDays(weekStart, i), "yyyy-MM-dd"),
  }));
}

function totalMinutes(entries: WorkEntry[]): number {
  return entries.reduce((sum, e) => {
    if (e.start_time && e.end_time) {
      const [sh, sm] = e.start_time.split(":").map(Number);
      const [eh, em] = e.end_time.split(":").map(Number);
      return sum + (eh * 60 + em) - (sh * 60 + sm);
    }
    return sum;
  }, 0);
}

// ---- Component ----
interface SheetFormProps {
  existingSheet?: WorkSheet | null;
}

export default function SheetForm({ existingSheet }: SheetFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const [client, setClient] = useState(existingSheet?.client || "");
  const [workNumber, setWorkNumber] = useState(existingSheet?.work_number || "");
  const [entries, setEntries] = useState<WorkEntry[]>(() => {
    if (existingSheet?.entries?.length) {
      return DAYS.map((d) => {
        const found = existingSheet.entries.find((e) => e.day === d.key);
        return found || emptyEntry(d.key);
      });
    }
    return DAYS.map((d) => emptyEntry(d.key));
  });

  const weekDates = getWeekDates(
    existingSheet
      ? new Date(existingSheet.week_start + "T00:00:00")
      : weekStart
  );

  const updateEntry = (dayKey: string, field: keyof WorkEntry, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.day === dayKey ? { ...e, [field]: value } : e))
    );
  };

  const handleSave = async (status: "draft" | "submitted") => {
    if (status === "submitted") setSubmitting(true);
    else setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sessão expirada.");
      router.push("/auth/login");
      return;
    }

    const ws = weekDates[0].date;

    // Upsert sheet
    const sheetPayload = {
      worker_id: user.id,
      week_start: ws,
      week_end: weekDates[5].date,
      client,
      work_number: workNumber,
      status,
    };

    let sheetId = existingSheet?.id;

    if (sheetId) {
      const { error } = await supabase
        .from("work_sheets")
        .update(sheetPayload)
        .eq("id", sheetId);
      if (error) {
        toast.error("Erro ao guardar: " + error.message);
        setSaving(false);
        setSubmitting(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("work_sheets")
        .insert(sheetPayload)
        .select("id")
        .single();
      if (error) {
        toast.error("Erro ao guardar: " + error.message);
        setSaving(false);
        setSubmitting(false);
        return;
      }
      sheetId = data.id;
    }

    // Upsert entries
    for (const entry of entries) {
      const entryPayload = {
        sheet_id: sheetId,
        day: entry.day,
        work_description: entry.work_description,
        work_type: entry.work_type,
        date: entry.date || weekDates.find((d) => d.key === entry.day)?.date || null,
        evaluation: entry.evaluation,
        signature: entry.signature,
        observations: entry.observations,
        start_time: entry.start_time || null,
        end_time: entry.end_time || null,
      };

      if (entry.id) {
        await supabase.from("work_entries").update(entryPayload).eq("id", entry.id);
      } else {
        await supabase.from("work_entries").insert(entryPayload);
      }
    }

    if (status === "submitted") {
      toast.success("Folha de serviço submetida com sucesso!");
    } else {
      toast.success("Rascunho guardado!");
    }

    router.push("/worker/dashboard");
    router.refresh();
  };

  const mins = totalMinutes(entries);
  const hrs = Math.floor(mins / 60);
  const min = mins % 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">EQX Folha de Serviço</h2>
            <p className="text-sm text-gray-500 mt-1">
              Semana de {format(new Date(weekDates[0].date + "T00:00:00"), "dd/MM", { locale: pt })} a{" "}
              {format(new Date(weekDates[5].date + "T00:00:00"), "dd/MM/yyyy", { locale: pt })}
            </p>
          </div>
          {existingSheet && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
              {existingSheet.status === "draft" ? "Rascunho" : existingSheet.status === "submitted" ? "Submetida" : "Validada"}
            </span>
          )}
        </div>

        {/* Client / Work number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="label-field">Cliente</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="input-field"
              placeholder="Nome do cliente"
            />
          </div>
          <div>
            <label className="label-field">Nº Obra</label>
            <input
              type="text"
              value={workNumber}
              onChange={(e) => setWorkNumber(e.target.value)}
              className="input-field"
              placeholder="Número da obra"
            />
          </div>
        </div>

        {/* Table: large screens */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-20">Dia</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Trabalho a executar (Detalhar)</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-36">Tipo de Trabalho</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-28">Data</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-24">Início</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-24">Fim</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-32">Avaliação</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-20">Rubrica</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.day} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 font-medium text-gray-900">
                    {DAYS[i].label}
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={entry.work_description}
                      onChange={(e) => updateEntry(entry.day, "work_description", e.target.value)}
                      className="input-field !py-1.5 !px-2 text-xs"
                      placeholder="Descrever trabalho..."
                    />
                  </td>
                  <td className="py-2 px-2">
                    <select
                      value={entry.work_type}
                      onChange={(e) => updateEntry(entry.day, "work_type", e.target.value)}
                      className="input-field !py-1.5 !px-2 text-xs"
                    >
                      {WORK_TYPES.map((wt) => (
                        <option key={wt.value} value={wt.value}>
                          {wt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="date"
                      value={entry.date || weekDates[i].date}
                      onChange={(e) => updateEntry(entry.day, "date", e.target.value)}
                      className="input-field !py-1.5 !px-2 text-xs"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="time"
                      value={entry.start_time}
                      onChange={(e) => updateEntry(entry.day, "start_time", e.target.value)}
                      className="input-field !py-1.5 !px-2 text-xs"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="time"
                      value={entry.end_time}
                      onChange={(e) => updateEntry(entry.day, "end_time", e.target.value)}
                      className="input-field !py-1.5 !px-2 text-xs"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={entry.evaluation}
                      onChange={(e) => updateEntry(entry.day, "evaluation", e.target.value)}
                      className="input-field !py-1.5 !px-2 text-xs"
                      placeholder="Após trabalho"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={entry.signature}
                      onChange={(e) => updateEntry(entry.day, "signature", e.target.value)}
                      className="input-field !py-1.5 !px-2 text-xs"
                      placeholder="Rubrica"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card list: mobile / tablet */}
        <div className="lg:hidden space-y-4">
          {entries.map((entry, i) => (
            <div key={entry.day} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">
                {DAYS[i].label} — {weekDates[i].date}
              </h3>
              <input
                type="text"
                value={entry.work_description}
                onChange={(e) => updateEntry(entry.day, "work_description", e.target.value)}
                className="input-field text-sm"
                placeholder="Trabalho a executar (Detalhar)"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={entry.work_type}
                  onChange={(e) => updateEntry(entry.day, "work_type", e.target.value)}
                  className="input-field text-sm"
                >
                  {WORK_TYPES.map((wt) => (
                    <option key={wt.value} value={wt.value}>
                      {wt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={entry.date || weekDates[i].date}
                  onChange={(e) => updateEntry(entry.day, "date", e.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Início</label>
                  <input
                    type="time"
                    value={entry.start_time}
                    onChange={(e) => updateEntry(entry.day, "start_time", e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Fim</label>
                  <input
                    type="time"
                    value={entry.end_time}
                    onChange={(e) => updateEntry(entry.day, "end_time", e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={entry.evaluation}
                  onChange={(e) => updateEntry(entry.day, "evaluation", e.target.value)}
                  className="input-field text-sm"
                  placeholder="Avaliação"
                />
                <input
                  type="text"
                  value={entry.signature}
                  onChange={(e) => updateEntry(entry.day, "signature", e.target.value)}
                  className="input-field text-sm"
                  placeholder="Rubrica"
                />
              </div>
              <input
                type="text"
                value={entry.observations}
                onChange={(e) => updateEntry(entry.day, "observations", e.target.value)}
                className="input-field text-sm"
                placeholder="Observações"
              />
            </div>
          ))}
        </div>

        {/* Observations (desktop) */}
        <div className="hidden lg:block mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Observações</h4>
          <div className="grid grid-cols-3 gap-2">
            {entries.map((entry, i) => (
              <div key={entry.day}>
                <label className="text-xs text-gray-500">{DAYS[i].label}</label>
                <input
                  type="text"
                  value={entry.observations}
                  onChange={(e) => updateEntry(entry.day, "observations", e.target.value)}
                  className="input-field !py-1.5 !px-2 text-xs"
                  placeholder="Obs."
                />
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Total de horas esta semana:{" "}
            <span className="font-bold text-gray-900">
              {hrs}h{min > 0 ? ` ${min}m` : ""}
            </span>
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          type="button"
          onClick={() => handleSave("draft")}
          disabled={saving || submitting}
          className="btn-secondary"
        >
          {saving ? "A guardar..." : "Guardar rascunho"}
        </button>
        <button
          type="button"
          onClick={() => handleSave("submitted")}
          disabled={submitting || saving}
          className="btn-primary"
        >
          {submitting ? "A submeter..." : "Submeter folha"}
        </button>
      </div>
    </div>
  );
}
