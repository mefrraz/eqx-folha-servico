import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import WeekNavigator from "./WeekNavigator";
import { calcMinutes, formatMinutes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HRHome({ searchParams }: { searchParams: { w?: string } }) {
  const supabase = await createClient();
  const today = new Date();
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const weekStart = searchParams.w ? new Date(searchParams.w + "T00:00:00") : thisMonday;
  const ws = format(weekStart, "yyyy-MM-dd");

  const { data: workers } = await supabase.from("profiles").select("id, full_name").eq("role","worker").order("full_name");
  const { data: weekSheets } = await supabase.from("work_sheets").select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)").eq("week_start",ws).order("created_at",{ascending:false});
  const { data: allSheets } = await supabase.from("work_sheets").select("work_entries(*)").limit(500);

  const totalW = workers?.length || 0;
  const ids = new Set((weekSheets||[]).map(s=>s.worker_id));
  const sub = (workers||[]).filter(w=>ids.has(w.id)).length;
  const not = totalW - sub;
  const hrsAll = (allSheets||[]).reduce((s,sh)=>s+calcMinutes(sh.work_entries||[]),0);
  const hrsWeek = (weekSheets||[]).reduce((s,sh)=>s+calcMinutes(sh.work_entries||[]),0);
  const pct = totalW>0?Math.round(sub/totalW*100):0;

  return (
    <div className="space-y-6">
      <WeekNavigator currentWeek={ws} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/hr/users" className="stat-card hover:border-brand-gold/40 transition-all"><span className="stat-value">{totalW}</span><span className="stat-label">Trabalhadores</span></Link>
        <div className="stat-card"><span className="stat-value">{formatMinutes(hrsWeek)}</span><span className="stat-label">Horas esta semana</span></div>
        <div className="stat-card"><span className="stat-value">{formatMinutes(hrsAll)}</span><span className="stat-label">Total de horas</span></div>
        <Link href="/hr/projects" className="stat-card hover:border-brand-gold/40 transition-all"><span className="stat-value">{new Set((weekSheets||[]).map(s=>s.work_number).filter(Boolean)).size}</span><span className="stat-label">Obras ativas</span></Link>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-brand-dark">Submissões — {format(weekStart,"dd/MM",{locale:pt})}</h3>
          <span className="font-mono text-sm text-brand-soft">{sub}/{totalW} · {pct}%</span>
        </div>
        <div className="flex gap-1.5 h-3">
          {sub>0 && <div className="bg-brand-gold rounded-full transition-all" style={{width:`${(sub/Math.max(totalW,1))*100}%`}} />}
          <div className="bg-brand-light/40 rounded-full flex-1" />
        </div>
        <div className="flex items-center gap-4 text-xs text-brand-soft font-medium">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-gold" />{sub} submeteram</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-light/40" />{not} pendentes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase mb-3">Submeteram</h4>
          <div className="space-y-1.5">{(weekSheets||[]).slice(0,8).map((s:any)=>(<Link key={s.id} href={`/hr/users/${s.worker_id}`} className="flex items-center justify-between py-2 px-2 -mx-2 rounded-xl hover:bg-brand-gold/5 transition-colors"><span className="text-sm text-brand-dark font-medium">{s.worker?.full_name||"—"}</span><span className="text-xs font-mono text-brand-soft">{formatMinutes(calcMinutes(s.work_entries||[]))}</span></Link>))}
          {(weekSheets||[]).length===0 && <p className="text-sm text-brand-muted py-2">Nenhuma submissão.</p>}</div>
        </div>
        <div className="card">
          <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase mb-3">Pendentes</h4>
          <div className="space-y-1.5">{(workers||[]).filter(w=>!ids.has(w.id)).slice(0,8).map(w=>(<Link key={w.id} href={`/hr/users/${w.id}`} className="flex items-center py-2 px-2 -mx-2 rounded-xl text-sm text-brand-soft hover:text-brand-dark hover:bg-brand-gold/5 transition-colors">{w.full_name}</Link>))}
          {not===0 && <p className="text-sm text-success py-2 font-medium">Todos submeteram!</p>}</div>
        </div>
      </div>
    </div>
  );
}
