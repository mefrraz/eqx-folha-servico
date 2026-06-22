"use client";

import { useRouter } from "next/navigation";
import { formatMinutes } from "@/lib/utils";
function pct(v: number, max: number) { return `${Math.round((v / max) * 100)}%`; }

interface ReportsClientProps {
  projectData: { name: string; mins: number; sheets: number; workers: Set<string> }[];
  maxProjectMins: number;
  workerData: { name: string; mins: number; sheets: number }[];
  maxWorkerMins: number;
  monthData: [string, number][];
  maxMonthMins: number;
  totalMins: number; totalWorkers: number; totalSheets: number;
  months: number;
}

const MONTH_OPTIONS = [3, 6, 9, 12];

export default function ReportsClient(props: ReportsClientProps) {
  const router = useRouter();
  const { projectData, maxProjectMins, workerData, maxWorkerMins, monthData, maxMonthMins, totalMins, totalWorkers, totalSheets, months } = props;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-dark">Relatórios</h2>
          <p className="text-sm text-brand-soft mt-0.5">Últimos {months} meses</p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl border border-brand-light/30 p-1">
          {MONTH_OPTIONS.map(m => (
            <button key={m} onClick={() => router.push(`/hr/reports?months=${m}`)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${months === m ? "bg-brand-gold/20 text-brand-dark" : "text-brand-soft hover:text-brand-dark"}`}>
              {m}m
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <span className="stat-value">{formatMinutes(totalMins)}</span>
          <span className="stat-label">Horas totais</span>
        </div>
        <div className="stat-card text-center">
          <span className="stat-value">{totalSheets}</span>
          <span className="stat-label">Folhas</span>
        </div>
        <div className="stat-card text-center">
          <span className="stat-value">{totalWorkers}</span>
          <span className="stat-label">Trabalhadores</span>
        </div>
      </div>

      {/* Hours by month — line bars */}
      <div className="card">
        <h3 className="text-sm font-semibold text-brand-dark mb-4">Horas por mês</h3>
        <div className="flex items-end gap-1 h-32">
          {monthData.map(([month, mins]) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-mono text-brand-soft">{Math.round(mins / 60)}h</span>
              <div className="w-full bg-brand-gold/60 rounded-t" style={{ height: pct(mins, maxMonthMins) }} />
              <span className="text-[10px] text-brand-muted">{month.substring(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By project */}
      <div className="card">
        <h3 className="text-sm font-semibold text-brand-dark mb-4">Horas por obra</h3>
        <div className="space-y-2">
          {projectData.slice(0, 10).map(p => (
            <div key={p.name}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-brand-dark font-medium truncate mr-2">{p.name}</span>
                <span className="font-mono text-brand-soft shrink-0">{formatMinutes(p.mins)} · {p.sheets} folhas</span>
              </div>
              <div className="h-3 bg-brand-light/20 rounded-full overflow-hidden">
                <div className="h-full bg-brand-gold/60 rounded-full" style={{ width: pct(p.mins, maxProjectMins) }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top workers */}
      <div className="card">
        <h3 className="text-sm font-semibold text-brand-dark mb-4">Top trabalhadores</h3>
        <div className="space-y-2">
          {workerData.slice(0, 10).map(w => (
            <div key={w.name}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-brand-dark font-medium">{w.name}</span>
                <span className="font-mono text-brand-soft">{formatMinutes(w.mins)} · {w.sheets} folhas</span>
              </div>
              <div className="h-3 bg-brand-light/20 rounded-full overflow-hidden">
                <div className="h-full bg-success/60 rounded-full" style={{ width: pct(w.mins, maxWorkerMins) }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
