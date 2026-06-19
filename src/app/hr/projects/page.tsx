import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";

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
function fmtM(m: number) { const h=Math.floor(m/60); const mi=m%60; return mi?`${h}h ${mi}m`:`${h}h`; }

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: sheets } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)")
    .order("week_start", { ascending: false })
    .limit(500);

  const projectMap = new Map<string, { sheets: any[]; workers: Set<string>; mins: number; latestWeek: string }>();
  for (const s of sheets || []) {
    const key = s.work_number || "Sem obra";
    if (!projectMap.has(key)) projectMap.set(key, { sheets: [], workers: new Set(), mins: 0, latestWeek: s.week_start });
    const p = projectMap.get(key)!;
    p.sheets.push(s);
    p.workers.add(s.worker_id);
    p.mins += calcMinutes(s.work_entries || []);
    if (s.week_start > p.latestWeek) p.latestWeek = s.week_start;
  }

  const projects = Array.from(projectMap.entries()).sort((a, b) => b[1].latestWeek.localeCompare(a[1].latestWeek));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-navy">Obras</h2>
        <p className="text-sm text-steel mt-0.5">{projects.length} obra{projects.length !== 1 ? "s" : ""} registada{projects.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="grid gap-3">
        {projects.length === 0 && (
          <div className="card text-center py-12 text-steel text-sm">Nenhuma obra registada.</div>
        )}
        {projects.map(([number, p]) => (
          <Link
            key={number}
            href={`/hr/projects/${encodeURIComponent(number)}`}
            className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-navy/30 transition-all group"
          >
            <div className="space-y-1.5">
              <p className="font-semibold text-navy text-base group-hover:text-navy transition-colors">
                {number === "Sem obra" ? "Sem obra atribuída" : number}
              </p>
              <div className="flex items-center gap-3 text-xs text-steel">
                <span className="font-medium">{p.workers.size} trabalhador{p.workers.size !== 1 ? "es" : ""}</span>
                <span className="w-0.5 h-0.5 bg-steel-300 rounded-full" />
                <span>{p.sheets.length} folha{p.sheets.length !== 1 ? "s" : ""}</span>
                <span className="w-0.5 h-0.5 bg-steel-300 rounded-full" />
                <span>Última: {format(new Date(p.latestWeek + "T00:00:00"), "dd/MM/yy", { locale: pt })}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const names = p.sheets.map((s: any) => s.worker?.full_name).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
                  return names.slice(0, 6).map((name: string) => (
                    <span key={name} className="text-[11px] bg-navy/[0.04] text-steel px-2 py-0.5 rounded">{name}</span>
                  ));
                })()}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="stat-value text-xl">{fmtM(p.mins)}</span>
              <span className="stat-label">horas</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
