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

const SHIFTS = ["morning", "afternoon"] as const;

/** Composite key identifying one row: day + shift */
type EntryKey = `${typeof DAYS[number]["key"]}-${typeof SHIFTS[number]}`;

function emptyEntry(day: WorkEntry["day"], shift: WorkEntry["shift"]): WorkEntry {
  return {
    day,
    shift,
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
  const [shiftPreference, setShiftPreference] = useState<"both" | "morning" | "afternoon">("both");
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const [client, setClient] = useState(existingSheet?.client || "");
  const [workNumber, setWorkNumber] = useState(existingSheet?.work_number || "");
  const [projects, setProjects] = useState<any[]>([]);

  // Fetch worker's assigned projects + shift preference
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("shift_preference")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.shift_preference) setShiftPreference(data.shift_preference);
        });
      supabase
        .from("worker_projects")
        .select("project:projects(id, name, number, client:clients(name))")
        .eq("worker_id", user.id)
        .then(({ data, error }) => {
          if (error) console.error("[SheetForm] worker_projects error:", error);
          else if (data) {
            const projs = data.map((r: any) => r.project).filter(Boolean);
            setProjects(projs);
          }
        });
    });
  }, []);

  // Shifts to display based on the worker's preference
  const activeShifts: WorkEntry["shift"][] =
    shiftPreference === "morning"
      ? ["morning"]
      : shiftPreference === "afternoon"
        ? ["afternoon"]
        : ["morning", "afternoon"];

  /** Toggle a shift as "não trabalhei" (fades fields, keeps them visible) */
  const toggleSkip = (key: string) => {
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const [entries, setEntries] = useState<WorkEntry[]>(() => {
    // Build 12 entries: 6 days × 2 shifts
    const flat: WorkEntry[] = [];
    for (const d of DAYS) {
      for (const s of SHIFTS) {
        if (existingSheet?.entries?.length) {
          const found = existingSheet.entries.find(
            (e) => e.day === d.key && e.shift === s
          );
          flat.push(found || emptyEntry(d.key, s));
        } else {
          flat.push(emptyEntry(d.key, s));
        }
      }
    }
    return flat;
  });

  const visibleEntries = entries.filter((e) => activeShifts.includes(e.shift));

  const weekDates = getWeekDates(
    existingSheet ? new Date(existingSheet.week_start + "T00:00:00") : weekStart
  );

  /** Update a single field on an entry, identified by "day-shift" key */
  const upd = (key: string, f: keyof WorkEntry, v: string) => {
    const [day, shift] = key.split("-") as [WorkEntry["day"], WorkEntry["shift"]];
    setEntries((p) =>
      p.map((e) => (e.day === day && e.shift === shift ? { ...e, [f]: v } : e))
    );
  };

  /** Validate shifts don't overlap: morning.end <= afternoon.start */
  function validateShifts(): string | null {
    for (const d of DAYS) {
      const morning = entries.find((e) => e.day === d.key && e.shift === "morning");
      const afternoon = entries.find((e) => e.day === d.key && e.shift === "afternoon");
      if (!morning || !afternoon) continue;

      const morningSkipped = skipped.has(`${d.key}-morning`);
      const afternoonSkipped = skipped.has(`${d.key}-afternoon`);

      // Validate each shift's own times (skip if marked as not worked)
      for (const shift of [morning, afternoon]) {
        if (skipped.has(`${d.key}-${shift.shift}`)) continue;
        if (shift.start_time && !shift.end_time) {
          return `${d.label} (${shift.shift === "morning" ? "manhã" : "tarde"}): hora de fim obrigatória.`;
        }
        if (shift.end_time && !shift.start_time) {
          return `${d.label} (${shift.shift === "morning" ? "manhã" : "tarde"}): hora de início obrigatória.`;
        }
        if (shift.start_time && shift.end_time && shift.start_time >= shift.end_time) {
          return `${d.label} (${shift.shift === "morning" ? "manhã" : "tarde"}): hora de início deve ser anterior à de fim.`;
        }
      }

      // Validate no overlap between morning and afternoon
      if (!morningSkipped && !afternoonSkipped && morning.end_time && afternoon.start_time) {
        if (morning.end_time > afternoon.start_time) {
          return `${d.label}: turnos sobrepostos. Fim da manhã (${morning.end_time}) deve ser ≤ início da tarde (${afternoon.start_time}).`;
        }
      }
    }
    return null;
  }

  const handleSave = async (status: "draft" | "submitted") => {
    if (status === "submitted") {
      if (!client.trim()) { toast.error("Cliente é obrigatório para submeter."); return; }
      if (!workNumber.trim()) { toast.error("Nº Obra é obrigatório para submeter."); return; }
      const overlapError = validateShifts();
      if (overlapError) { toast.error(overlapError); return; }
      setSubmitting(true);
    } else {
      setSaving(true);
    }

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
    if (!sid) {
      const { data: existing } = await supabase
        .from("work_sheets")
        .select("id")
        .eq("worker_id", user.id)
        .eq("week_start", ws)
        .maybeSingle();
      if (existing) {
        sid = existing.id;
      }
    }
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

    // Upsert entries — insert new, update existing
    for (const e of entries) {
      const isSkipped = skipped.has(`${e.day}-${e.shift}`);
      const ep = {
        sheet_id: sid,
        day: e.day,
        shift: e.shift,
        work_description: isSkipped ? "" : e.work_description,
        work_type: isSkipped ? "" : e.work_type,
        date: e.date || weekDates.find((d) => d.key === e.day)?.date || null,
        evaluation: isSkipped ? "" : e.evaluation,
        signature: isSkipped ? "" : e.signature,
        observations: isSkipped ? "" : e.observations,
        start_time: isSkipped ? null : e.start_time || null,
        end_time: isSkipped ? null : e.end_time || null,
      };
      if (e.id) {
        await supabase.from("work_entries").update(ep).eq("id", e.id);
      } else {
        await supabase.from("work_entries").insert(ep);
      }
    }

    toast.success(status === "submitted" ? "Folha submetida!" : "Rascunho guardado!");
    router.push("/worker/dashboard");
    router.refresh();
  };

  const mins = calcMinutes(entries.filter((e) => !skipped.has(`${e.day}-${e.shift}`)));
  const hrs = Math.floor(mins / 60);
  const min = mins % 60;

  /** Real-time overlap check — returns the first day with overlapping shifts */
  const liveOverlap = (() => {
    for (const d of DAYS) {
      const morning = entries.find((e) => e.day === d.key && e.shift === "morning");
      const afternoon = entries.find((e) => e.day === d.key && e.shift === "afternoon");
      if (!morning || !afternoon) continue;
      if (skipped.has(`${d.key}-morning`) || skipped.has(`${d.key}-afternoon`)) continue;
      if (morning.end_time && afternoon.start_time && morning.end_time > afternoon.start_time) {
        return `${d.label}: turnos sobrepostos. Fim da manhã (${morning.end_time}) deve ser ≤ início da tarde (${afternoon.start_time}).`;
      }
    }
    return null;
  })();

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
        <SheetTable entries={visibleEntries} weekDates={weekDates} upd={upd} />

        {/* Mobile cards */}
        <SheetMobileCards
          entries={visibleEntries}
          weekDates={weekDates}
          upd={upd}
          skipped={skipped}
          onToggleSkip={toggleSkip}
        />

        {/* Desktop observations row */}
        <div className="hidden lg:block mt-4">
          <h4 className="text-sm font-semibold text-brand-soft mb-2">Observações</h4>
          <div className="grid grid-cols-3 gap-2">
            {DAYS.map((d) => (
              <div key={d.key}>
                <label className="text-xs text-brand-muted">{d.label}</label>
                <input
                  type="text"
                  value={entries.find((e) => e.day === d.key && e.shift === "morning")?.observations || ""}
                  onChange={(ev) => upd(`${d.key}-morning`, "observations", ev.target.value)}
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

        {liveOverlap && (
          <div className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠️ {liveOverlap}
          </div>
        )}
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
