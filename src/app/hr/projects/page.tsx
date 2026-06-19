import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

function calcMinutes(entries: any[]): number {
  return entries.reduce((s: number, e: any) => {
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

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: sheets } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)")
    .order("week_start", { ascending: false })
    .limit(500);

  // Group by work_number
  const projectMap = new Map<string, { sheets: any[]; workers: Set<string>; totalMins: number; latestWeek: string }>();
  for (const s of sheets || []) {
    const key = s.work_number || "Sem obra";
    if (!projectMap.has(key)) {
      projectMap.set(key, { sheets: [], workers: new Set(), totalMins: 0, latestWeek: s.week_start });
    }
    const p = projectMap.get(key)!;
    p.sheets.push(s);
    p.workers.add(s.worker_id);
    p.totalMins += calcMinutes(s.work_entries || []);
    if (s.week_start > p.latestWeek) p.latestWeek = s.week_start;
  }

  const projects = Array.from(projectMap.entries()).sort((a, b) => b[1].latestWeek.localeCompare(a[1].latestWeek));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Obras</h2>

      <div className="grid gap-3">
        {projects.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">Nenhuma obra registada.</div>
        ) : (
          projects.map(([projectNumber, p]) => (
            <div key={projectNumber} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  🏗️ {projectNumber}
                </p>
                <p className="text-sm text-gray-500">
                  {p.workers.size} trabalhador{p.workers.size !== 1 ? "es" : ""} ·{" "}
                  {p.sheets.length} folha{p.sheets.length !== 1 ? "s" : ""} ·{" "}
                  Última: {format(new Date(p.latestWeek + "T00:00:00"), "dd/MM/yyyy", { locale: pt })}
                </p>
                {/* Show worker names */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {sheets
                    ?.filter((s) => (s.work_number || "Sem obra") === projectNumber)
                    .map((s) => s.worker?.full_name)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .slice(0, 8)
                    .map((name: string) => (
                      <span key={name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {name}
                      </span>
                    ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-gray-800">{fmtMinutes(p.totalMins)}</p>
                <p className="text-xs text-gray-500">Total horas</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
