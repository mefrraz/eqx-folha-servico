import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek } from "date-fns";
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

export default async function HRHome({ searchParams }: { searchParams: { w?: string } }) {
  const supabase = await createClient();
  const today = new Date();
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const weekStart = searchParams.w ? new Date(searchParams.w + "T00:00:00") : thisMonday;
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  const { data: workers } = await supabase.from("profiles").select("id, full_name").eq("role", "worker").order("full_name");

  const { data: weekSheets } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)")
    .eq("week_start", weekStartStr)
    .order("created_at", { ascending: false });

  const { data: allSheets } = await supabase.from("work_sheets").select("work_entries(*)").limit(500);

  const totalWorkers = workers?.length || 0;
  const workerIdsWithSheet = new Set((weekSheets || []).map((s) => s.worker_id));
  const submitted = (workers || []).filter((w) => workerIdsWithSheet.has(w.id)).length;
  const notSubmitted = totalWorkers - submitted;
  const totalHoursAll = (allSheets || []).reduce((s, sh) => s + calcMinutes(sh.work_entries || []), 0);
  const totalHoursWeek = (weekSheets || []).reduce((s, sh) => s + calcMinutes(sh.work_entries || []), 0);
  const pct = totalWorkers > 0 ? Math.round((submitted / totalWorkers) * 100) : 0;

  return (
    <div className="space-y-6">
      <WeekNavigator currentWeek={weekStartStr} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/hr/users" className="stat-card hover:border-navy/30 transition-colors">
          <span className="stat-value">{totalWorkers}</span>
          <span className="stat-label">Trabalhadores</span>
        </Link>
        <div className="stat-card">
          <span className="stat-value">{fmtMinutes(totalHoursWeek)}</span>
          <span className="stat-label">Horas esta semana</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{fmtMinutes(totalHoursAll)}</span>
          <span className="stat-label">Total de horas</span>
        </div>
        <Link href="/hr/projects" className="stat-card hover:border-navy/30 transition-colors">
          <span className="stat-value">{new Set((weekSheets || []).map((s) => s.work_number).filter(Boolean)).size}</span>
          <span className="stat-label">Obras ativas</span>
        </Link>
      </div>

      {/* Progress bar — submitted */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy tracking-wide">
            Submissões — {format(weekStart, "dd/MM", { locale: pt })}
          </h3>
          <span className="font-mono text-sm text-steel tabular-nums">
            {submitted}/{totalWorkers} · {pct}%
          </span>
        </div>

        <div className="flex gap-2 h-2">
          {submitted > 0 && (
            <div
              className="bg-green rounded-l-sm transition-all"
              style={{ width: `${(submitted / Math.max(totalWorkers, 1)) * 100}%` }}
            />
          )}
          <div
            className="bg-steel-300/50 rounded-r-sm flex-1"
            style={submitted === 0 ? { borderRadius: "2px" } : {}}
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-steel">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-green" />
            {submitted} submeteram
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-steel-300/50" />
            {notSubmitted} pendentes
          </span>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h4 className="text-xs font-semibold text-steel tracking-wide uppercase mb-3">Submeteram</h4>
          <div className="space-y-2">
            {(weekSheets || []).slice(0, 8).map((s: any) => (
              <Link
                key={s.id}
                href={`/hr/users/${s.worker_id}`}
                className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded hover:bg-navy/[0.03] transition-colors"
              >
                <span className="text-sm text-navy font-medium">{s.worker?.full_name || "—"}</span>
                <span className="text-xs font-mono text-steel">{fmtMinutes(calcMinutes(s.work_entries || []))}</span>
              </Link>
            ))}
            {(weekSheets || []).length === 0 && (
              <p className="text-sm text-steel/60 py-2">Nenhuma submissão esta semana.</p>
            )}
          </div>
        </div>

        <div className="card">
          <h4 className="text-xs font-semibold text-steel tracking-wide uppercase mb-3">Pendentes</h4>
          <div className="space-y-2">
            {(workers || []).filter((w) => !workerIdsWithSheet.has(w.id)).slice(0, 8).map((w) => (
              <Link
                key={w.id}
                href={`/hr/users/${w.id}`}
                className="flex items-center py-1.5 px-2 -mx-2 rounded text-sm text-steel hover:text-navy hover:bg-navy/[0.03] transition-colors"
              >
                {w.full_name}
              </Link>
            ))}
            {notSubmitted === 0 && (
              <p className="text-sm text-green/70 py-2">Todos submeteram!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
