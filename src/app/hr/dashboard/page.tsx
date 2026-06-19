import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { Suspense } from "react";
import ValidateButton from "./ValidateButton";
import EditProfile from "./EditProfile";
import WeekFilter from "./WeekFilter";
import ViewToggle from "./ViewToggle";

export const dynamic = "force-dynamic";

const WORK_TYPE_LABELS: Record<string, string> = {
  new_installation: "Nova Instalação",
  installation_continuation: "Continuação instalação",
  preventive_maintenance: "Manutenção preventiva",
  corrective_maintenance: "Manutenção corretiva",
};

const DAY_LABELS: Record<string, string> = {
  monday: "2ª", tuesday: "3ª", wednesday: "4ª",
  thursday: "5ª", friday: "6ª", saturday: "Sáb",
};

function calcMinutes(entries: any[]): number {
  return entries.reduce((s, e) => {
    if (e.start_time && e.end_time) {
      const [sh, sm] = e.start_time.split(":").map(Number);
      const [eh, em] = e.end_time.split(":").map(Number);
      return s + (eh * 60 + em) - (sh * 60 + sm);
    }
    return s;
  }, 0);
}

function fmtMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function daysAgo(dateStr: string): string {
  const days = differenceInDays(new Date(), new Date(dateStr));
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

export default async function HRDashboard({
  searchParams,
}: {
  searchParams: { week?: string; view?: string };
}) {
  const supabase = await createClient();
  const today = new Date();
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const filterWeek = searchParams.week ? new Date(searchParams.week + "T00:00:00") : null;
  const viewMode = searchParams.view || "worker";

  // Fetch all workers
  const { data: workers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "worker")
    .order("full_name");

  // Fetch sheets — filtered by week if specified
  let query = supabase
    .from("work_sheets")
    .select("*, work_entries(*)")
    .order("week_start", { ascending: false });

  if (filterWeek) {
    query = query.eq("week_start", searchParams.week);
  }

  const { data: sheets } = await query.limit(500);

  // Group sheets by worker
  const sheetsByWorker = new Map<string, any[]>();
  if (sheets) {
    for (const s of sheets) {
      const wid = s.worker_id;
      if (!sheetsByWorker.has(wid)) sheetsByWorker.set(wid, []);
      sheetsByWorker.get(wid)!.push(s);
    }
  }

  // ── Stats ──
  const allSheets = sheets || [];

  // Total hours (all) + horas esta semana
  const thisWeekStart = format(thisMonday, "yyyy-MM-dd");
  let totalHoursAll = 0;
  let totalHoursThisWeek = 0;
  const activeProjects = new Set<string>();

  for (const s of allSheets) {
    const mins = calcMinutes(s.work_entries || []);
    totalHoursAll += mins;
    if (s.week_start === thisWeekStart) {
      totalHoursThisWeek += mins;
      if (s.work_number) activeProjects.add(s.work_number);
    }
  }

  const totalWorkers = workers?.length || 0;
  const totalSubmitted = allSheets.filter((s) => s.status === "submitted").length;
  const totalDrafts = allSheets.filter((s) => s.status === "draft").length || 0;
  const totalReviewed = allSheets.filter((s) => s.status === "reviewed").length;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Dashboard RH</h2>
        <div className="flex items-center gap-3">
          <Suspense fallback={<div className="input-field !py-2 !px-3 text-sm w-auto bg-gray-100 animate-pulse">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>}>
            <WeekFilter />
          </Suspense>
          <Suspense fallback={<div className="w-48 h-8 bg-gray-100 rounded-lg animate-pulse" />}>
            <ViewToggle />
          </Suspense>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="card text-center !p-3">
          <p className="text-2xl font-bold text-primary-700">{totalWorkers}</p>
          <p className="text-xs text-gray-500 mt-0.5">Trabalhadores</p>
        </div>
        <div className="card text-center !p-3">
          <p className="text-2xl font-bold text-gray-800">{fmtMinutes(totalHoursThisWeek)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Horas esta semana</p>
        </div>
        <div className="card text-center !p-3">
          <p className="text-2xl font-bold text-gray-800">{fmtMinutes(totalHoursAll)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total horas</p>
        </div>
        <div className="card text-center !p-3">
          <p className="text-2xl font-bold text-gray-800">{activeProjects.size}</p>
          <p className="text-xs text-gray-500 mt-0.5">Obras ativas</p>
        </div>
        <div className="card text-center !p-3">
          <p className="text-2xl font-bold text-green-700">{totalSubmitted}</p>
          <p className="text-xs text-gray-500 mt-0.5">Submetidas</p>
        </div>
        <div className="card text-center !p-3">
          <p className="text-2xl font-bold text-blue-700">{totalReviewed}</p>
          <p className="text-xs text-gray-500 mt-0.5">Validadas</p>
        </div>
      </div>

      {/* ── Worker view ── */}
      {viewMode === "worker" && (
        <div className="space-y-6">
          {!workers || workers.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">Nenhum trabalhador registado.</div>
          ) : (
            workers.map((worker) => {
              const wSheets = sheetsByWorker.get(worker.id) || [];
              const latestSheet = wSheets[0];
              const mins = calcMinutes(latestSheet?.work_entries || []);
              const hrs = Math.floor(mins / 60);
              const m = mins % 60;

              return (
                <details key={worker.id} className="card group">
                  <summary className="cursor-pointer list-none flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg font-semibold text-gray-900">{worker.full_name}</span>
                      {worker.company && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{worker.company}</span>
                      )}
                      <EditProfile userId={worker.id} fullName={worker.full_name} company={worker.company || ""} />
                      {latestSheet && (
                        <span className="text-xs text-gray-400">
                          Última: semana{" "}
                          {format(new Date(latestSheet.week_start + "T00:00:00"), "dd/MM", { locale: pt })}{" "}
                          · {hrs}h{m > 0 ? ` ${m}m` : ""}
                        </span>
                      )}
                    </div>
                    <span className="text-primary-600 text-sm group-open:hidden shrink-0">Ver folhas ▼</span>
                    <span className="text-primary-600 text-sm hidden group-open:inline shrink-0">Ocultar ▲</span>
                  </summary>

                  <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                    {wSheets.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhuma folha.</p>
                    ) : (
                      wSheets.map((sheet) => {
                        const eMins = calcMinutes(sheet.work_entries || []);
                        const eHrs = Math.floor(eMins / 60);
                        const eM = eMins % 60;

                        return (
                          <div key={sheet.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  Semana {format(new Date(sheet.week_start + "T00:00:00"), "dd/MM", { locale: pt })}{" "}
                                  — {format(new Date(sheet.week_end + "T00:00:00"), "dd/MM/yyyy", { locale: pt })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Cliente: {sheet.client || "—"} · Obra: {sheet.work_number || "—"}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">{fmtMinutes(eMins)}</span>
                                <ValidateButton sheetId={sheet.id} currentStatus={sheet.status} />
                              </div>
                            </div>

                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-500 border-b border-gray-100">
                                  <th className="text-left py-1 font-medium">Dia</th>
                                  <th className="text-left py-1 font-medium">Trabalho</th>
                                  <th className="text-left py-1 font-medium">Tipo</th>
                                  <th className="text-right py-1 font-medium">Horas</th>
                                </tr>
                              </thead>
                              <tbody>
                                {["monday","tuesday","wednesday","thursday","friday","saturday"].map((day) => {
                                  const entry = (sheet.work_entries || []).find((e: any) => e.day === day);
                                  if (!entry) return null;
                                  let dayMins = 0;
                                  if (entry.start_time && entry.end_time) {
                                    const [sh, sm] = entry.start_time.split(":").map(Number);
                                    const [eh, em] = entry.end_time.split(":").map(Number);
                                    dayMins = eh * 60 + em - (sh * 60 + sm);
                                  }
                                  return (
                                    <tr key={day} className="border-b border-gray-50">
                                      <td className="py-1 font-medium">{DAY_LABELS[day]}</td>
                                      <td className="py-1 text-gray-600">{entry.work_description || "—"}</td>
                                      <td className="py-1 text-gray-500">{WORK_TYPE_LABELS[entry.work_type] || "—"}</td>
                                      <td className="py-1 text-right tabular-nums">
                                        {dayMins > 0 ? fmtMinutes(dayMins) : "—"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                              {sheet.observations ? (
                                <p className="text-xs text-gray-500">Obs: {sheet.observations}</p>
                              ) : <span />}
                              <p className="text-xs text-gray-400">
                                Atualizado {daysAgo(sheet.updated_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </details>
              );
            })
          )}
        </div>
      )}

      {/* ── Project view ── */}
      {viewMode === "project" && (
        <div className="space-y-6">
          {(() => {
            // Group sheets by work_number
            const projectMap = new Map<string, any[]>();
            for (const s of allSheets) {
              const key = s.work_number || "Sem obra";
              if (!projectMap.has(key)) projectMap.set(key, []);
              projectMap.get(key)!.push(s);
            }

            const projects = [...projectMap.entries()].sort((a, b) => {
              // Sort by most recent
              const aLatest = a[1][0]?.week_start || "";
              const bLatest = b[1][0]?.week_start || "";
              return bLatest.localeCompare(aLatest);
            });

            return projects.map(([projectNumber, projectSheets]) => {
              const totalMins = projectSheets.reduce((sum, s) => sum + calcMinutes(s.work_entries || []), 0);
              const uniqueWorkers = new Set(projectSheets.map((s) => s.worker_id));

              return (
                <details key={projectNumber} className="card group">
                  <summary className="cursor-pointer list-none flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg font-semibold text-gray-900">
                        {projectNumber === "Sem obra" ? "Sem obra" : `🏗️ ${projectNumber}`}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {uniqueWorkers.size} trabalhador{uniqueWorkers.size !== 1 ? "es" : ""}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{fmtMinutes(totalMins)}</span>
                    </div>
                    <span className="text-primary-600 text-sm group-open:hidden shrink-0">Ver folhas ▼</span>
                    <span className="text-primary-600 text-sm hidden group-open:inline shrink-0">Ocultar ▲</span>
                  </summary>

                  <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                    {projectSheets.map((sheet) => {
                      const name = workers?.find((w) => w.id === sheet.worker_id)?.full_name || "—";
                      const eMins = calcMinutes(sheet.work_entries || []);
                      return (
                        <div key={sheet.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div>
                              <p className="font-medium text-gray-900">{name}</p>
                              <p className="text-xs text-gray-500">
                                Semana {format(new Date(sheet.week_start + "T00:00:00"), "dd/MM", { locale: pt })}{" "}
                                — {format(new Date(sheet.week_end + "T00:00:00"), "dd/MM/yyyy", { locale: pt })}{" "}
                                · Cliente: {sheet.client || "—"}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium">{fmtMinutes(eMins)}</span>
                              <ValidateButton sheetId={sheet.id} currentStatus={sheet.status} />
                              <span className="text-xs text-gray-400">{daysAgo(sheet.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
