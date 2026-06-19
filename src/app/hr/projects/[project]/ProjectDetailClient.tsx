"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, startOfWeek as sunStart } from "date-fns";
import { pt } from "date-fns/locale";
import MonthCalendar from "@/components/MonthCalendar";
import toast from "react-hot-toast";

const DL:Record<string,string>={monday:"2ª",tuesday:"3ª",wednesday:"4ª",thursday:"5ª",friday:"6ª",saturday:"Sáb"};
const WT:Record<string,string>={new_installation:"Nova Instalação",installation_continuation:"Continuação",preventive_maintenance:"Manut. preventiva",corrective_maintenance:"Manut. corretiva"};
function cM(e:any[]){return e.reduce((s:number,x:any)=>{if(x.start_time&&x.end_time){const[a,b]=x.start_time.split(":").map(Number);const[c,d]=x.end_time.split(":").map(Number);return s+(c*60+d)-(a*60+b)}return s},0);}
function fM(m:number){const h=Math.floor(m/60);const mi=m%60;return mi?`${h}h ${mi}m`:`${h}h`;}

export default function ProjectDetailClient({ project, sheets: allSheets }: { project: any; sheets: any[] }) {
  const [selectedSunday, setSelectedSunday] = useState<Date | null>(null);
  const [weekSheets, setWeekSheets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const supabase = createClient();

  // Get unique workers
  const workers = Array.from(new Map(allSheets.map(s => [s.worker_id, { id: s.worker_id, name: s.worker?.full_name }])).values());

  const filteredWorkers = search ? workers.filter(w => w.name?.toLowerCase().includes(search.toLowerCase())) : workers;

  // Sheet weeks for calendar
  const sheetWeeks = allSheets.map((s: any) => ({
    weekStart: addDays(new Date(s.week_start+"T00:00:00"), -1),
    weekEnd: addDays(new Date(s.week_end+"T00:00:00"), -1),
    hasSheet: true, sheetId: s.id, status: s.status
  }));

  const totalMins = allSheets.reduce((s: number, sh: any) => s + cM(sh.work_entries || []), 0);
  const weeksCount = new Set(allSheets.map(s => s.week_start)).size;
  const avg = weeksCount > 0 ? Math.round((totalMins / 60) / weeksCount) : 0;
  const wM = new Map<string,number>(); for(const s of allSheets){const m=cM(s.work_entries||[]);wM.set(s.week_start,(wM.get(s.week_start)||0)+m);}
  const sW = Array.from(wM.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  const max = Math.max(...Array.from(wM.values()),1);

  const handleWeekSelect = useCallback((sunday: Date) => {
    setSelectedSunday(sunday);
    const monday = format(addDays(sunday, 1), "yyyy-MM-dd");
    const sheets = allSheets.filter((s: any) => s.week_start === monday);
    setWeekSheets(sheets);
  }, [allSheets]);

  const toggle = (id: string) => {
    setExpanded(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleValidate = async (sheetId: string) => {
    await supabase.from("work_sheets").update({status:"reviewed"}).eq("id",sheetId);
    setWeekSheets(prev => prev.map(s => s.id===sheetId ? {...s,status:"reviewed"} : s));
    toast.success("Validada!");
  };

  const visibleSheets = weekSheets.slice(0, 6);
  const hiddenCount = weekSheets.length - 6;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-dark">{project.name}</h2>
            {project.client?.name && <p className="text-sm text-brand-soft">{project.client.name}{project.location ? ` · ${project.location}` : ""}</p>}
          </div>
          <div className="flex gap-4 text-right shrink-0">
            <div><span className="stat-value text-lg">{fM(totalMins)}</span><span className="stat-label ml-1">total</span></div>
            <div><span className="stat-value text-lg">{Math.round(avg)}h</span><span className="stat-label ml-1">média/sem</span></div>
          </div>
        </div>
      </div>

      {/* Calendar + Search + Sheet detail */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Calendar */}
        <div className="card !p-4 w-full lg:w-[280px] lg:h-[280px] shrink-0 flex items-center justify-center">
          <MonthCalendar sheets={sheetWeeks} selectedWeek={selectedSunday} onSelectWeek={handleWeekSelect} />
        </div>

        {/* Search workers */}
        <div className="card !p-4 w-full lg:w-[220px] lg:h-[280px] shrink-0">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-field text-xs !py-1.5 mb-2" placeholder="Pesquisar colaborador…" />
          <div className="space-y-1 max-h-[220px] overflow-y-auto">
            {filteredWorkers.map((w: any) => (
              <a key={w.id} href={`/hr/users/${w.id}`} className="block text-xs text-brand-soft hover:text-brand-dark hover:bg-brand-gold/5 px-2 py-1 rounded transition-colors">{w.name}</a>
            ))}
            {filteredWorkers.length===0 && <p className="text-xs text-brand-muted px-2">Nenhum resultado</p>}
          </div>
        </div>

        {/* Sheet detail */}
        <div className="card !p-4 flex-1 min-h-[280px]">
          {!selectedSunday ? (
            <div className="text-center py-16 text-brand-muted text-sm">Selecione uma semana</div>
          ) : weekSheets.length === 0 ? (
            <div className="text-center py-16"><p className="text-brand-muted text-sm">Nenhuma folha esta semana</p></div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-brand-dark">Semana {format(selectedSunday,"dd/MM",{locale:pt})} – {format(addDays(selectedSunday,6),"dd/MM/yy",{locale:pt})} — {weekSheets.length} folha{weekSheets.length!==1?"s":""}</h4>
              {visibleSheets.map((s: any) => {
                const isOpen = expanded.has(s.id);
                return (
                  <div key={s.id} className="border border-brand-light/30 rounded-xl">
                    <button onClick={() => toggle(s.id)} className="w-full flex items-center justify-between p-3 hover:bg-brand-gold/5 transition-colors rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-brand-dark text-sm">{s.worker?.full_name||"—"}</span>
                        <span className="text-xs font-mono text-brand-soft">{fM(cM(s.work_entries||[]))}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.status==="submitted"?<span className="badge-submitted text-xs">Submetida</span>:s.status==="draft"?<span className="badge-draft text-xs">Rascunho</span>:<span className="badge-reviewed text-xs">Validada</span>}
                        <span className="text-xs text-brand-muted">{isOpen?"▲":"▼"}</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3">
                        <table className="w-full text-xs"><thead><tr className="text-brand-soft border-b border-brand-light/30"><th className="text-left py-1">Dia</th><th className="text-left py-1">Trabalho</th><th className="text-left py-1">Tipo</th><th className="text-right py-1">Horas</th></tr></thead>
                        <tbody>{["monday","tuesday","wednesday","thursday","friday","saturday"].map(day=>{const e=(s.work_entries||[]).find((x:any)=>x.day===day);if(!e)return null;let dm=0;if(e.start_time&&e.end_time){const[a,b]=e.start_time.split(":").map(Number);const[c,d]=e.end_time.split(":").map(Number);dm=c*60+d-(a*60+b);}return(<tr key={day} className="border-b border-brand-light/20"><td className="py-1 font-medium">{DL[day]}</td><td className="py-1 text-brand-soft">{e.work_description||"—"}</td><td className="py-1 text-brand-muted">{WT[e.work_type]||"—"}</td><td className="py-1 text-right font-mono">{dm>0?fM(dm):"—"}</td></tr>);})}</tbody></table>
                        <div className="flex gap-2 mt-2">
                          {s.status==="submitted"&&<button onClick={()=>handleValidate(s.id)} className="badge-submitted cursor-pointer hover:brightness-95 text-xs">Validar</button>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {hiddenCount > 0 && (
                <button onClick={() => setExpanded(new Set(weekSheets.map(s => s.id)))} className="text-xs text-brand-gold font-medium hover:underline">
                  Ver mais {hiddenCount} folhas
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
