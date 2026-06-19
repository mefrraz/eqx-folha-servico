import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, addDays, subDays } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import WeekNavigator from "./WeekNavigator";

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

export default async function HRHome({
  searchParams,
}: {
  searchParams: { w?: string };
}) {
  const supabase = await createClient();
  const today = new Date();
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const weekStart = searchParams.w
    ? new Date(searchParams.w + "T00:00:00")
    : thisMonday;
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  // Fetch all workers
  const { data: workers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "worker")
    .order("full_name");

  // Fetch sheets for selected week
  const { data: weekSheets } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)")
    .eq("week_start", weekStartStr)
    .order("created_at", { ascending: false });

  // Fetch ALL sheets for total stats
  const { data: allSheets } = await supabase
    .from("work_sheets")
    .select("work_entries(*)")
    .limit(500);

  const workerIdsWithSheet = new Set((weekSheets || []).map((s) => s.worker_id));
  const submittedCount = (workers || []).filter((w) => workerIdsWithSheet.has(w.id)).length;
  const notSubmittedCount = (workers || []).length - submittedCount;

  // Total hours all time
  const totalHoursAll = (allSheets || []).reduce((sum, s) => sum + calcMinutes(s.work_entries || []), 0);

  // Hours this week
  const totalHoursWeek = (weekSheets || []).reduce((sum, s) => sum + calcMinutes(s.work_entries || []), 0);

  // Active projects this week
  const projectsThisWeek = new Set((weekSheets || []).map((s) => s.work_number).filter(Boolean));

  // Max bar value
  const maxBar = Math.max(submittedCount, notSubmittedCount, 1);

  return (
    <div className="space-y-6">
      <WeekNavigator currentWeek={weekStartStr} />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/hr/users" className="card !p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-2xl font-bold text-primary-700">{workers?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Trabalhadores</p>
        </Link>
        <div className="card !p-3 text-center">
          <p className="text-2xl font-bold text-gray-800">{fmtMinutes(totalHoursWeek)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Horas esta semana</p>
        </div>
        <div className="card !p-3 text-center">
          <p className="text-2xl font-bold text-gray-800">{fmtMinutes(totalHoursAll)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total horas</p>
        </div>
        <Link href="/hr/projects" className="card !p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-2xl font-bold text-gray-800">{projectsThisWeek.size}</p>
          <p className="text-xs text-gray-500 mt-0.5">Obras ativas</p>
        </Link>
      </div>

      {/* Chart: Submitted vs Not */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Folhas submetidas — semana de {format(weekStart, "dd/MM", { locale: pt })}
        </h3>
        
        <div className="flex items-end gap-6 h-40 px-4">
          {/* Submitted bar */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <span className="text-2xl font-bold text-green-600">{submittedCount}</span>
            <div
              className="w-full max-w-[120px] bg-green-500 rounded-t-lg transition-all"
              style={{ height: `${(submittedCount / maxBar) * 100}%` }}
            />
            <span className="text-xs text-gray-500 font-medium">Submeteram</span>
          </div>

          {/* Not submitted bar */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <span className="text-2xl font-bold text-red-500">{notSubmittedCount}</span>
            <div
              className="w-full max-w-[120px] bg-red-400 rounded-t-lg transition-all"
              style={{ height: `${(notSubmittedCount / maxBar) * 100}%` }}
            />
            <span className="text-xs text-gray-500 font-medium">Não submeteram</span>
          </div>
        </div>
      </div>

      {/* Quick list: who submitted / who didn't */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-green-700 mb-3">
            ✅ Submeteram ({submittedCount})
          </h3>
          <ul className="space-y-2">
            {(weekSheets || []).slice(0, 10).map((s: any) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <Link href={`/hr/users/${s.worker_id}`} className="text-gray-900 hover:text-primary-600 font-medium">
                  {s.worker?.full_name || "—"}
                </Link>
                <span className="text-xs text-gray-500">
                  {s.client || "—"} · {fmtMinutes(calcMinutes(s.work_entries || []))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-red-600 mb-3">
            ❌ Não submeteram ({notSubmittedCount})
          </h3>
          <ul className="space-y-2">
            {(workers || [])
              .filter((w) => !workerIdsWithSheet.has(w.id))
              .slice(0, 10)
              .map((w) => (
                <li key={w.id} className="text-sm">
                  <Link href={`/hr/users/${w.id}`} className="text-gray-500 hover:text-primary-600">
                    {w.full_name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
