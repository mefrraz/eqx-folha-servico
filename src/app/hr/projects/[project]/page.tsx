import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, subDays } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import ValidateButton from "../../dashboard/ValidateButton";

export const dynamic = "force-dynamic";

const DAY_LABELS: Record<string, string> = {
  monday: "2ª", tuesday: "3ª", wednesday: "4ª", thursday: "5ª", friday: "6ª", saturday: "Sáb",
};
const WORK_TYPE_LABELS: Record<string, string> = {
  new_installation: "Nova Instalação", installation_continuation: "Continuação instalação",
  preventive_maintenance: "Manutenção preventiva", corrective_maintenance: "Manutenção corretiva",
};

function calcM(entries: any[]): number {
  return entries.reduce((s: number, e: any) => {
    if (e.start_time && e.end_time) {
      const [sh, sm] = e.start_time.split(":").map(Number);
      const [eh, em] = e.end_time.split(":").map(Number);
      return s + (eh * 60 + em) - (sh * 60 + sm);
    }
    return s;
  }, 0);
}
function fmtM(m: number) { const h = Math.floor(m/60); const mi = m % 60; return mi ? `${h}h ${mi}m` : `${h}h`; }

function weekLabel(d: string) {
  const date = new Date(d + "T00:00:00");
  return format(date, "dd/MM", { locale: pt });
}

export default async function ProjectDetailPage({ params }: { params: { project: string } }) {
  const supabase = await createClient();
  const projectNumber = decodeURIComponent(params.project);

  const { data: sheets } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)")
    .eq("work_number", projectNumber)
    .order("week_start", { ascending: false })
    .limit(200);

  if (!projectNumber || sheets?.length === 0) {
    return (
      <div className="card text-center py-16">
        <p className="text-steel text-sm">Obra não encontrada ou sem folhas.</p>
        <Link href="/hr/projects" className="btn-ghost mt-3 inline-flex">← Obras</Link>
      </div>
    );
  }

  const safeSheets = sheets!;
  const totalMins = safeSheets.reduce((s, sh) => s + calcM(sh.work_entries || []), 0);
  const workerSet = new Set(safeSheets.map((s) => s.worker_id));
  const weeksCount = new Set(safeSheets.map((s) => s.week_start)).size;
  const avgHoursPerWeek = weeksCount > 0 ? totalMins / 60 / weeksCount : 0;

  // Weekly breakdown for chart
  const weeklyMins = new Map<string, number>();
  for (const s of safeSheets) {
    const m = calcM(s.work_entries || []);
    weeklyMins.set(s.week_start, (weeklyMins.get(s.week_start) || 0) + m);
  }
  const sortedWeeks = Array.from(weeklyMins.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const maxWeekMins = Math.max(...Array.from(weeklyMins.values()), 1);

  return (
    <div className="space-y-6">
      <Link href="/hr/projects" className="text-xs text-steel hover:text-navy transition-colors">← Obras</Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy">{projectNumber === "Sem obra" ? "Sem obra atribuída" : projectNumber}</h2>
          <p className="text-sm text-steel mt-1">
            {workerSet.size} trabalhador{workerSet.size !== 1 ? "es" : ""} · {safeSheets.length} folha{safeSheets.length !== 1 ? "s" : ""} · {weeksCount} semana{weeksCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-4 text-right">
          <div><span className="stat-value text-lg">{fmtM(totalMins)}</span><span className="stat-label ml-1">total</span></div>
          <div><span className="stat-value text-lg">{Math.round(avgHoursPerWeek)}h</span><span className="stat-label ml-1">média/semana</span></div>
        </div>
      </div>

      {/* Chart: weekly hours */}
      <div className="card space-y-4">
        <h4 className="text-xs font-semibold text-steel tracking-wide uppercase">Horas por semana</h4>
        <div className="space-y-2">
          {sortedWeeks.slice(-8).map(([w, mins]) => (
            <div key={w} className="flex items-center gap-3">
              <span className="text-xs font-mono text-steel w-14 tabular-nums text-right">{weekLabel(w)}</span>
              <div className="flex-1 h-5 bg-navy/[0.04] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gold/70 rounded-sm transition-all"
                  style={{ width: `${(mins / maxWeekMins) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-navy w-16 tabular-nums">{fmtM(mins)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sheets */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-steel tracking-wide uppercase">Folhas</h4>
        {safeSheets.map((sheet) => {
          const eMins = calcM(sheet.work_entries || []);
          return (
            <details key={sheet.id} className="card !p-4 group">
              <summary className="cursor-pointer list-none flex items-center justify-between">
                <div>
                  <span className="font-medium text-navy text-sm">
                    {sheet.worker?.full_name || "—"}
                  </span>
                  <span className="text-xs text-steel ml-3">
                    Sem. {weekLabel(sheet.week_start)} – {weekLabel(sheet.week_end)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-navy">{fmtM(eMins)}</span>
                  <ValidateButton sheetId={sheet.id} currentStatus={sheet.status} />
                </div>
              </summary>
              <table className="w-full text-xs mt-3">
                <thead>
                  <tr className="text-steel border-b border-steel-300/30">
                    <th className="text-left py-1.5 font-medium">Dia</th>
                    <th className="text-left py-1.5 font-medium">Trabalho</th>
                    <th className="text-left py-1.5 font-medium">Tipo</th>
                    <th className="text-right py-1.5 font-medium">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {["monday","tuesday","wednesday","thursday","friday","saturday"].map((day) => {
                    const entry = (sheet.work_entries || []).find((e: any) => e.day === day);
                    if (!entry) return null;
                    let dmin = 0;
                    if (entry.start_time && entry.end_time) {
                      const [sh, sm] = entry.start_time.split(":").map(Number);
                      const [eh, em] = entry.end_time.split(":").map(Number);
                      dmin = eh * 60 + em - (sh * 60 + sm);
                    }
                    return (
                      <tr key={day} className="border-b border-steel-300/10">
                        <td className="py-1.5 font-medium text-navy">{DAY_LABELS[day]}</td>
                        <td className="py-1.5 text-steel">{entry.work_description || "—"}</td>
                        <td className="py-1.5 text-steel/70">{WORK_TYPE_LABELS[entry.work_type] || "—"}</td>
                        <td className="py-1.5 text-right font-mono text-navy">{dmin > 0 ? fmtM(dmin) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          );
        })}
      </div>
    </div>
  );
}
