"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { format, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import toast from "react-hot-toast";
import type { WorkSheet, WorkEntry } from "@/lib/types";
import { calcMinutes } from "@/lib/utils";
import SheetTable from "@/components/SheetTable";
import SheetMobileCards from "@/components/SheetMobileCards";

const DAYS = [
  { key: "monday", label: "2ª Feira" },
  { key: "tuesday", label: "3ª Feira" },
  { key: "wednesday", label: "4ª Feira" },
  { key: "thursday", label: "5ª Feira" },
  { key: "friday", label: "6ª Feira" },
  { key: "saturday", label: "Sábado" },
] as const;

function emptyEntry(day: WorkEntry["day"]): WorkEntry {
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

function getWeekDates(ws: Date) {
  return DAYS.map((d, i) => ({ ...d, date: format(addDays(ws, i), "yyyy-MM-dd") }));
}

export default function SheetForm({ existingSheet }: { existingSheet?: WorkSheet | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const [client, setClient] = useState(existingSheet?.client || "");
  const [workNumber, setWorkNumber] = useState(existingSheet?.work_number || "");
  const [projects, setProjects] = useState<any[]>([]);

  // Fetch worker's assigned projects
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("worker_projects")
        .select("project:projects(id, name, number, client:clients(name))")
        .eq("worker_id", user.id)
        .then(({ data }) => {
          if (data) setProjects(data.map((r: any) => r.project).filter(Boolean));
        });
    });
  }, []);
  const [entries, setEntries] = useState<WorkEntry[]>(() => {
    if (existingSheet?.entries?.length) {
      return DAYS.map(
        (d) => existingSheet.entries.find((e) => e.day === d.key) || emptyEntry(d.key)
      );
    }
    return DAYS.map((d) => emptyEntry(d.key));
  });

  const weekDates = getWeekDates(
    existingSheet ? new Date(existingSheet.week_start + "T00:00:00") : weekStart
  );

  const upd = (dk: string, f: keyof WorkEntry, v: string) => {
    setEntries((p) => p.map((e) => (e.day === dk ? { ...e, [f]: v } : e)));
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
    const payload = {
      worker_id: user.id,
      week_start: ws,
      week_end: weekDates[5].date,
      client,
      work_number: workNumber,
      status,
    };

    let sid = existingSheet?.id;
    if (sid) {
      const { error } = await supabase.from("work_sheets").update(payload).eq("id", sid);
      if (error) {
        toast.error("Erro: " + error.message);
        setSaving(false);
        setSubmitting(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("work_sheets")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        toast.error("Erro: " + error.message);
        setSaving(false);
        setSubmitting(false);
        return;
      }
      sid = data.id;
    }

    for (const e of entries) {
      const ep = {
        sheet_id: sid,
        day: e.day,
        work_description: e.work_description,
        work_type: e.work_type,
        date: e.date || weekDates.find((d) => d.key === e.day)?.date || null,
        evaluation: e.evaluation,
        signature: e.signature,
        observations: e.observations,
        start_time: e.start_time || null,
        end_time: e.end_time || null,
      };
      if (e.id) await supabase.from("work_entries").update(ep).eq("id", e.id);
      else await supabase.from("work_entries").insert(ep);
    }

    toast.success(status === "submitted" ? "Folha submetida!" : "Rascunho guardado!");
    router.push("/worker/dashboard");
    router.refresh();
  };

  const mins = calcMinutes(entries);
  const hrs = Math.floor(mins / 60);
  const min = mins % 60;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-brand-dark">EQX Folha de Serviço</h2>
            <p className="text-sm text-brand-soft mt-1">
              Semana de{" "}
              {format(new Date(weekDates[0].date + "T00:00:00"), "dd/MM", { locale: pt })} a{" "}
              {format(new Date(weekDates[5].date + "T00:00:00"), "dd/MM/yyyy", { locale: pt })}
            </p>
          </div>
          {existingSheet && (
            <span className="badge-draft">
              {existingSheet.status === "draft"
                ? "Rascunho"
                : existingSheet.status === "submitted"
                  ? "Submetida"
                  : "Validada"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div>
            <label className="label-field">Obra atribuída</label>
            <select
              value=""
              onChange={(e) => {
                const p = projects.find(p => p.id === e.target.value);
                if (p) {
                  setClient(p.client?.name || "");
                  setWorkNumber(p.number || "");
                }
              }}
              className="input-field"
            >
              <option value="">— Selecionar —</option>
              {projects.length === 0 && <option disabled>Sem obras atribuídas</option>}
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.number ? `(${p.number})` : ""} {p.client?.name ? `— ${p.client.name}` : ""}
                </option>
              ))}
            </select>
          </div>
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
              placeholder="Livre"
            />
          </div>
        </div>

        {/* Desktop table */}
        <SheetTable entries={entries} weekDates={weekDates} upd={upd} />

        {/* Mobile cards */}
        <SheetMobileCards entries={entries} weekDates={weekDates} upd={upd} />

        {/* Desktop observations row */}
        <div className="hidden lg:block mt-4">
          <h4 className="text-sm font-semibold text-brand-soft mb-2">Observações</h4>
          <div className="grid grid-cols-3 gap-2">
            {entries.map((e, i) => (
              <div key={e.day}>
                <label className="text-xs text-brand-muted">{DAYS[i].label}</label>
                <input
                  type="text"
                  value={e.observations}
                  onChange={(ev) => upd(e.day, "observations", ev.target.value)}
                  className="input-field !py-1.5 !px-2 text-xs"
                  placeholder="Obs."
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-brand-light/30 flex items-center justify-between">
          <p className="text-sm text-brand-soft">
            Total de horas esta semana:{" "}
            <span className="font-bold font-mono text-brand-dark">
              {hrs}h{min > 0 ? ` ${min}m` : ""}
            </span>
          </p>
        </div>
      </div>

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
