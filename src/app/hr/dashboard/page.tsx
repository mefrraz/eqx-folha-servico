import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-yellow-100 text-yellow-800" },
  submitted: { label: "Submetida", color: "bg-green-100 text-green-800" },
  reviewed: { label: "Validada", color: "bg-blue-100 text-blue-800" },
};

const WORK_TYPE_LABELS: Record<string, string> = {
  new_installation: "Nova Instalação",
  installation_continuation: "Continuação instalação",
  preventive_maintenance: "Manutenção preventiva",
  corrective_maintenance: "Manutenção corretiva",
};

export default async function HRDashboard() {
  const supabase = await createClient();

  // Fetch all workers
  const { data: workers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "worker")
    .order("full_name");

  // Fetch recent sheets with their entries
  const { data: recentSheets } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*)")
    .order("week_start", { ascending: false })
    .limit(200);

  // Group sheets by worker
  const sheetsByWorker = new Map<string, any[]>();
  if (recentSheets) {
    for (const sheet of recentSheets) {
      const wid = sheet.worker_id;
      if (!sheetsByWorker.has(wid)) sheetsByWorker.set(wid, []);
      sheetsByWorker.get(wid)!.push(sheet);
    }
  }

  // Stats
  const totalWorkers = workers?.length || 0;
  const totalSubmitted = recentSheets?.filter((s) => s.status === "submitted").length || 0;
  const totalDrafts = recentSheets?.filter((s) => s.status === "draft").length || 0;
  const totalHours = recentSheets?.reduce((sum, s) => {
    return sum + (s.work_entries || []).reduce((entrySum: number, e: any) => {
      if (e.start_time && e.end_time) {
        const [sh, sm] = e.start_time.split(":").map(Number);
        const [eh, em] = e.end_time.split(":").map(Number);
        return entrySum + (eh * 60 + em) - (sh * 60 + sm);
      }
      return entrySum;
    }, 0);
  }, 0) || 0;
  const totalHoursH = Math.floor(totalHours / 60);
  const totalHoursM = totalHours % 60;

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-700">{totalWorkers}</p>
          <p className="text-sm text-gray-500 mt-1">Trabalhadores</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-700">{totalSubmitted}</p>
          <p className="text-sm text-gray-500 mt-1">Submetidas</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-700">{totalDrafts}</p>
          <p className="text-sm text-gray-500 mt-1">Rascunhos</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-700">{totalHoursH}h{totalHoursM > 0 ? ` ${totalHoursM}m` : ""}</p>
          <p className="text-sm text-gray-500 mt-1">Total horas</p>
        </div>
      </div>

      {/* Workers list */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Folhas por trabalhador
        </h2>

        {!workers || workers.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            Nenhum trabalhador registado.
          </div>
        ) : (
          <div className="space-y-6">
            {workers.map((worker) => {
              const sheets = sheetsByWorker.get(worker.id) || [];
              const latestSheet = sheets[0];

              // Calculate hours for latest sheet
              const mins = (latestSheet?.work_entries || []).reduce(
                (sum: number, e: any) => {
                  if (e.start_time && e.end_time) {
                    const [sh, sm] = e.start_time.split(":").map(Number);
                    const [eh, em] = e.end_time.split(":").map(Number);
                    return sum + (eh * 60 + em) - (sh * 60 + sm);
                  }
                  return sum;
                },
                0
              );
              const hrs = Math.floor(mins / 60);
              const m = mins % 60;

              return (
                <details key={worker.id} className="card group">
                  <summary className="cursor-pointer list-none flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-900">
                        {worker.full_name}
                      </span>
                      {latestSheet && (
                        <span className="text-xs text-gray-500">
                          Última: Semana{" "}
                          {format(new Date(latestSheet.week_start + "T00:00:00"), "dd/MM", {
                            locale: pt,
                          })}{" "}
                          · {hrs}h{m > 0 ? `${m}m` : ""}
                        </span>
                      )}
                    </div>
                    <span className="text-primary-600 text-sm group-open:hidden">
                      Ver folhas ▼
                    </span>
                    <span className="text-primary-600 text-sm hidden group-open:inline">
                      Ocultar ▲
                    </span>
                  </summary>

                  <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                    {sheets.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Nenhuma folha registada.
                      </p>
                    ) : (
                      sheets.map((sheet) => {
                        const eMins = (sheet.work_entries || []).reduce(
                          (sum: number, e: any) => {
                            if (e.start_time && e.end_time) {
                              const [sh, sm] = e.start_time.split(":").map(Number);
                              const [eh, em] = e.end_time.split(":").map(Number);
                              return sum + (eh * 60 + em) - (sh * 60 + sm);
                            }
                            return sum;
                          },
                          0
                        );
                        const eHrs = Math.floor(eMins / 60);
                        const eM = eMins % 60;

                        return (
                          <div
                            key={sheet.id}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  Semana{" "}
                                  {format(
                                    new Date(sheet.week_start + "T00:00:00"),
                                    "dd/MM",
                                    { locale: pt }
                                  )}{" "}
                                  —{" "}
                                  {format(
                                    new Date(sheet.week_end + "T00:00:00"),
                                    "dd/MM/yyyy",
                                    { locale: pt }
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Cliente: {sheet.client || "—"} · Obra:{" "}
                                  {sheet.work_number || "—"}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">
                                  {eHrs}h{eM > 0 ? ` ${eM}m` : ""}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    STATUS_LABELS[sheet.status]?.color
                                  }`}
                                >
                                  {STATUS_LABELS[sheet.status]?.label || sheet.status}
                                </span>
                              </div>
                            </div>

                            {/* Day-by-day breakdown */}
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
                                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(
                                  (day) => {
                                    const entry = (sheet.work_entries || []).find(
                                      (e: any) => e.day === day
                                    );
                                    if (!entry) return null;
                                    let dayMins = 0;
                                    if (entry.start_time && entry.end_time) {
                                      const [sh, sm] = entry.start_time.split(":").map(Number);
                                      const [eh, em] = entry.end_time.split(":").map(Number);
                                      dayMins = eh * 60 + em - (sh * 60 + sm);
                                    }
                                    const dHrs = Math.floor(dayMins / 60);
                                    const dM = dayMins % 60;

                                    const dayLabels: Record<string, string> = {
                                      monday: "2ª",
                                      tuesday: "3ª",
                                      wednesday: "4ª",
                                      thursday: "5ª",
                                      friday: "6ª",
                                      saturday: "Sáb",
                                    };

                                    return (
                                      <tr key={day} className="border-b border-gray-50">
                                        <td className="py-1 font-medium">
                                          {dayLabels[day]}
                                        </td>
                                        <td className="py-1 text-gray-600">
                                          {entry.work_description || "—"}
                                        </td>
                                        <td className="py-1 text-gray-500">
                                          {WORK_TYPE_LABELS[entry.work_type] || "—"}
                                        </td>
                                        <td className="py-1 text-right tabular-nums">
                                          {dayMins > 0 ? `${dHrs}h${dM > 0 ? ` ${dM}m` : ""}` : "—"}
                                        </td>
                                      </tr>
                                    );
                                  }
                                )}
                              </tbody>
                            </table>

                            {sheet.observations && (
                              <p className="text-xs text-gray-500 mt-2">
                                Obs: {sheet.observations}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
