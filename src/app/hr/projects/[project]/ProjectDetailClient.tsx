"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import toast from "react-hot-toast";

const DL:Record<string,string>={monday:"2ª",tuesday:"3ª",wednesday:"4ª",thursday:"5ª",friday:"6ª",saturday:"Sáb"};
const WL:Record<string,string>={new_installation:"Nova Instalação",installation_continuation:"Continuação",preventive_maintenance:"Manut. preventiva",corrective_maintenance:"Manut. corretiva"};
function cM(e:any[]){return e.reduce((s:number,x:any)=>{if(x.start_time&&x.end_time){const[a,b]=x.start_time.split(":").map(Number);const[c,d]=x.end_time.split(":").map(Number);return s+(c*60+d)-(a*60+b)}return s},0);}
function fM(m:number){const h=Math.floor(m/60);const mi=m%60;return mi?`${h}h ${mi}m`:`${h}h`;}
function wL(d:string){return format(new Date(d+"T00:00:00"),"dd/MM",{locale:pt});}

export default function ProjectDetailClient({ project, sheets: initialSheets }: { project: any; sheets: any[] }) {
  const [sheets, setSheets] = useState(initialSheets);
  const supabase = createClient();

  const safe = sheets || [];
  const tM = safe.reduce((s,sh)=>s+cM(sh.work_entries||[]),0);
  const wS = new Set(safe.map(s=>s.worker_id));
  const wC = new Set(safe.map(s=>s.week_start)).size;
  const avg = wC>0?tM/60/wC:0;
  const wM = new Map<string,number>(); for(const s of safe){const m=cM(s.work_entries||[]);wM.set(s.week_start,(wM.get(s.week_start)||0)+m);}
  const sW = Array.from(wM.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  const max = Math.max(...Array.from(wM.values()),1);
  const workers = Array.from(new Map(safe.map(s=>[s.worker_id,{id:s.worker_id,name:s.worker?.full_name}])).values());

  const handleValidate = async (sheetId: string) => {
    await supabase.from("work_sheets").update({status:"reviewed"}).eq("id",sheetId);
    setSheets(prev => prev.map(s => s.id === sheetId ? {...s, status:"reviewed"} : s));
    toast.success("Validada!");
  };

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
            <div><span className="stat-value text-lg">{fM(tM)}</span><span className="stat-label ml-1">total</span></div>
            <div><span className="stat-value text-lg">{Math.round(avg)}h</span><span className="stat-label ml-1">média/sem</span></div>
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Workers column */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Trabalhadores ({workers.length})</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {workers.map(w=>(
                <a key={w.id} href={`/hr/users/${w.id}`} className="text-xs bg-brand-gold/10 text-brand-dark font-medium px-2.5 py-1 rounded-full hover:bg-brand-gold/20 transition-colors">{w.name}</a>
              ))}
              {workers.length===0 && <p className="text-xs text-brand-muted">Nenhum trabalhador.</p>}
            </div>
          </div>
        </div>

        {/* Chart + sheets */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-2">
            <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Horas por semana</h4>
            {sW.slice(-6).map(([w,m])=>(
              <div key={w} className="flex items-center gap-2">
                <span className="text-xs font-mono text-brand-soft w-14 text-right">{wL(w)}</span>
                <div className="flex-1 h-4 bg-brand-light/20 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-gold/70 rounded-full" style={{width:`${(m/max)*100}%`}}/>
                </div>
                <span className="text-xs font-mono text-brand-dark w-14">{fM(m)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Folhas recentes</h4>
            {safe.slice(0,10).map(s=>(
              <div key={s.id} className="card !p-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-brand-dark text-sm">{s.worker?.full_name||"—"}</span>
                  <span className="text-xs text-brand-soft ml-2">{wL(s.week_start)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-brand-dark">{fM(cM(s.work_entries||[]))}</span>
                  {s.status==="submitted" ? (
                    <button onClick={()=>handleValidate(s.id)} className="badge-submitted cursor-pointer hover:brightness-95 text-xs">Validar</button>
                  ) : s.status==="draft" ? <span className="badge-draft text-xs">Rascunho</span> : <span className="badge-reviewed text-xs">Validada</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
