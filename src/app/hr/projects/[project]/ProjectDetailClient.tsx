"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, startOfWeek as sunStart } from "date-fns";
import { pt } from "date-fns/locale";
import MonthCalendar from "@/components/MonthCalendar";
import toast from "react-hot-toast";
import { calcMinutes, formatMinutes } from "@/lib/utils";
import { DAY_LABELS, WORK_TYPE_LABELS } from "@/lib/types";

const DL = DAY_LABELS;
const WT = WORK_TYPE_LABELS;

export default function ProjectDetailClient({ project, sheets: allSheets, assignedCount }: { project: any; sheets: any[]; assignedCount: number }) {
  const [selectedSunday, setSelectedSunday] = useState<Date | null>(null);
  const [weekSheets, setWeekSheets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

  const wM = new Map<string,number>(); for(const s of allSheets){const m=calcMinutes(s.work_entries||[]);wM.set(s.week_start,(wM.get(s.week_start)||0)+m);}
  const sW = Array.from(wM.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  const max = Math.max(...Array.from(wM.values()),1);

  const handleWeekSelect = useCallback((sunday: Date) => {
    setSelectedSunday(sunday);
    const monday = format(addDays(sunday, 1), "yyyy-MM-dd");
    const sheets = allSheets.filter((s: any) => s.week_start === monday);
    setWeekSheets(sheets);
  }, [allSheets]);

  const toggleSelect = (id: string) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const selectAll = () => {
    const submitted = weekSheets.filter(s => s.status === "submitted");
    if (selected.size === submitted.length) setSelected(new Set());
    else setSelected(new Set(submitted.map(s => s.id)));
  };

  const bulkValidate = async () => {
    for (const id of Array.from(selected)) {
      await supabase.from("work_sheets").update({ status: "reviewed" }).eq("id", id);
    }
    setWeekSheets(prev => prev.map(s => selected.has(s.id) ? { ...s, status: "reviewed" } : s));
    setSelected(new Set());
    toast.success(`${selected.size} folhas validadas!`);
  };

  const handleValidate = async (sheetId: string) => {
    await supabase.from("work_sheets").update({status:"reviewed"}).eq("id",sheetId);
    setWeekSheets(prev => prev.map(s => s.id===sheetId ? {...s,status:"reviewed"} : s));
    toast.success("Validada!");
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
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
        </div>
      </div>

      {/* Calendar + Search | Sheet detail */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left column: calendar + search */}
        <div className="flex flex-col gap-4 w-full lg:w-[280px] shrink-0">
          <div className="card !p-4 lg:h-[280px] flex items-center justify-center">
            <MonthCalendar sheets={sheetWeeks} selectedWeek={selectedSunday} onSelectWeek={handleWeekSelect} />
          </div>
          <div className="card !p-3">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-field text-xs !py-1.5" placeholder="Pesquisar colaborador…" />
            <div className="space-y-0.5 mt-2 max-h-[180px] overflow-y-auto">
              {filteredWorkers.map((w: any) => (
                <a key={w.id} href={`/hr/users/${w.id}`} className="block text-xs text-brand-soft hover:text-brand-dark hover:bg-brand-gold/5 px-2 py-1 rounded transition-colors">{w.name}</a>
              ))}
              {filteredWorkers.length===0 && <p className="text-xs text-brand-muted px-2">Nenhum</p>}
            </div>
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
              {weekSheets.some(s => s.status === "submitted") && (
                <div className="flex items-center gap-2">
                  <button onClick={selectAll} className="text-xs text-brand-muted hover:text-brand-dark">
                    {selected.size === weekSheets.filter(s => s.status === "submitted").length ? "Desmarcar todas" : "Selecionar todas"}
                  </button>
                  {selected.size > 0 && (
                    <button onClick={bulkValidate} className="btn-primary text-xs !py-1 !px-3">
                      Validar {selected.size} folha{selected.size !== 1 ? "s" : ""}
                    </button>
                  )}
                </div>
              )}
              {visibleSheets.map((s: any) => {
                const isOpen = expanded.has(s.id);
                return (
                  <div key={s.id} className="border border-brand-light/30 rounded-xl">
                    <div className="flex items-center p-3 hover:bg-brand-gold/5 transition-colors rounded-xl">
                      {s.status === "submitted" && (
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)}
                          className="mr-2 w-4 h-4 accent-brand-gold cursor-pointer" onClick={e => e.stopPropagation()} />
                      )}
                      <button onClick={() => toggleExpand(s.id)} className="flex-1 flex items-center justify-between text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-brand-dark text-sm">{s.worker?.full_name||"—"}</span>
                        <span className="text-xs font-mono text-brand-soft">{formatMinutes(calcMinutes(s.work_entries||[]))}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.status==="submitted"?<span className="badge-submitted text-xs">Submetida</span>:s.status==="draft"?<span className="badge-draft text-xs">Rascunho</span>:<span className="badge-reviewed text-xs">Validada</span>}
                        <span className="text-xs text-brand-muted">{isOpen?"▲":"▼"}</span>
                      </div>
                    </button>
                    </div>
                    {isOpen && (
                      <div className="px-3 pb-3">
                        <table className="w-full text-xs"><thead><tr className="text-brand-soft border-b border-brand-light/30"><th className="text-left py-1">Dia</th><th className="text-left py-1">Trabalho</th><th className="text-left py-1">Tipo</th><th className="text-right py-1">Horas</th></tr></thead>
                        <tbody>{["monday","tuesday","wednesday","thursday","friday","saturday"].map(day=>{const e=(s.work_entries||[]).find((x:any)=>x.day===day);if(!e)return null;let dm=0;if(e.start_time&&e.end_time){const[a,b]=e.start_time.split(":").map(Number);const[c,d]=e.end_time.split(":").map(Number);dm=c*60+d-(a*60+b);}return(<tr key={day} className="border-b border-brand-light/20"><td className="py-1 font-medium">{DL[day]}</td><td className="py-1 text-brand-soft">{e.work_description||"—"}</td><td className="py-1 text-brand-muted">{WT[e.work_type]||"—"}</td><td className="py-1 text-right font-mono">{dm>0?formatMinutes(dm):"—"}</td></tr>);})}</tbody></table>
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
