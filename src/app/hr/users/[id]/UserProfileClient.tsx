"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import MonthCalendar from "@/components/MonthCalendar";
import EditUserForm from "./EditUserForm";
import DeleteUserButton from "./DeleteUserButton";
import toast from "react-hot-toast";

const DL:Record<string,string>={monday:"2ª",tuesday:"3ª",wednesday:"4ª",thursday:"5ª",friday:"6ª",saturday:"Sáb"};
const WT:Record<string,string>={new_installation:"Nova Instalação",installation_continuation:"Continuação",preventive_maintenance:"Manut. preventiva",corrective_maintenance:"Manut. corretiva"};
function cM(e:any[]){return e.reduce((s:number,x:any)=>{if(x.start_time&&x.end_time){const[a,b]=x.start_time.split(":").map(Number);const[c,d]=x.end_time.split(":").map(Number);return s+(c*60+d)-(a*60+b)}return s},0);}
function fM(m:number){const h=Math.floor(m/60);const mi=m%60;return mi?`${h}h ${mi}m`:`${h}h`;}

export default function UserProfileClient({ userId, profile, sheets: initialSheets }: { userId: string; profile: any; sheets: any[] }) {
  const [sheets, setSheets] = useState(initialSheets);
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [workerProjects, setWorkerProjects] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("projects").select("id,name,client:clients(name)").order("name").then(({data}) => setAllProjects(data||[]));
    // Get worker's projects from sheets
    const pids = new Set(initialSheets.map(s => s.project_id).filter(Boolean));
    supabase.from("projects").select("id,name,client:clients(name)").in("id", Array.from(pids)).then(({data}) => setWorkerProjects(data||[]));
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      const ws = format(selectedWeek, "yyyy-MM-dd");
      setSelectedSheet(sheets.find((s: any) => s.week_start === ws) || null);
    }
  }, [selectedWeek, sheets]);

  const totalMins = sheets.reduce((s: number, sh: any) => s + cM(sh.work_entries || []), 0);
  const latestSheet = sheets[0];
  const sheetWeeks = sheets.map((s: any) => ({ weekStart: new Date(s.week_start+"T00:00:00"), weekEnd: new Date(s.week_end+"T00:00:00"), hasSheet: true, sheetId: s.id, status: s.status }));

  const handleValidate = async (sheetId: string) => {
    const r = await fetch("/api/validate-sheet", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({sheetId}) });
    const d = await r.json();
    if (d.error) toast.error(d.error);
    else { setSheets(prev => prev.map(s => s.id===sheetId ? {...s,status:"reviewed"} : s)); toast.success("Validada!"); }
  };

  const addProjectToWorker = async (projectId: string) => {
    if (!projectId) return;
    toast.success("Obra associada. As próximas folhas serão vinculadas.");
    setWorkerProjects(prev => {
      const exists = prev.find(p => p.id === projectId);
      if (exists) return prev;
      const p = allProjects.find(p => p.id === projectId);
      return p ? [...prev, p] : prev;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top header — spacious */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark">{profile.full_name}</h2>
            <p className="text-xs font-mono text-brand-muted mt-1">{userId}</p>
          </div>
          <div className="flex gap-8 text-right">
            <div>
              <span className="block text-3xl font-bold font-mono text-brand-dark">{fM(totalMins)}</span>
              <span className="text-xs text-brand-muted tracking-wide uppercase">Horas totais</span>
            </div>
            <div>
              <span className="block text-3xl font-bold font-mono text-brand-dark">{sheets.length}</span>
              <span className="text-xs text-brand-muted tracking-wide uppercase">Folhas</span>
            </div>
            <div>
              <span className="block text-3xl font-bold font-mono text-brand-dark">{latestSheet ? format(new Date(latestSheet.week_start+"T00:00:00"), "dd/MM", {locale:pt}) : "—"}</span>
              <span className="text-xs text-brand-muted tracking-wide uppercase">Última folha</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <EditUserForm userId={userId} fullName={profile.full_name} />

      {/* Manage projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Obras</h4>
          <div className="flex items-center gap-2">
            <select onChange={e => addProjectToWorker(e.target.value)} defaultValue="" className="input-field !py-1.5 !px-2 text-xs w-48">
              <option value="">Adicionar obra…</option>
              {allProjects.filter(p => !workerProjects.some(wp => wp.id === p.id)).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {workerProjects.length === 0 && <p className="text-xs text-brand-muted">Nenhuma obra associada.</p>}
          {workerProjects.map((p: any) => (
            <span key={p.id} className="text-sm bg-brand-gold/10 text-brand-dark font-medium px-3 py-1.5 rounded-full flex items-center gap-2">
              {p.name}
              {p.client?.name && <span className="text-brand-muted font-normal">— {p.client.name}</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar (smaller) + Sheet detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <MonthCalendar sheets={sheetWeeks} selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />
        </div>

        <div className="card min-h-[200px]">
          {!selectedWeek ? (
            <div className="text-center py-16 text-brand-muted text-sm">Selecione uma semana no calendário</div>
          ) : !selectedSheet ? (
            <div className="text-center py-16">
              <p className="text-brand-muted text-sm mb-2">Nenhuma folha esta semana</p>
              <p className="text-xs text-brand-soft">{format(selectedWeek,"dd/MM",{locale:pt})} – {format(addDays(selectedWeek,5),"dd/MM/yyyy",{locale:pt})}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-brand-dark">Semana {format(new Date(selectedSheet.week_start+"T00:00:00"),"dd/MM",{locale:pt})} – {format(new Date(selectedSheet.week_end+"T00:00:00"),"dd/MM/yy",{locale:pt})}</h4>
                <span className={selectedSheet.status==="draft"?"badge-draft":selectedSheet.status==="submitted"?"badge-submitted":"badge-reviewed"}>
                  {selectedSheet.status==="draft"?"Rascunho":selectedSheet.status==="submitted"?"Submetida":"Validada"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-xs text-brand-muted">Cliente</span><p className="text-brand-dark font-medium">{selectedSheet.client||"—"}</p></div>
                <div><span className="text-xs text-brand-muted">Obra</span><p className="text-brand-dark font-medium">{selectedSheet.work_number||"—"}</p></div>
              </div>

              <div className="text-center py-3 bg-brand-gold/5 rounded-xl">
                <span className="text-2xl font-bold font-mono text-brand-dark">{fM(cM(selectedSheet.work_entries||[]))}</span>
                <p className="text-xs text-brand-soft mt-1">Horas trabalhadas</p>
              </div>

              <div className="space-y-2">
                {["monday","tuesday","wednesday","thursday","friday","saturday"].map(day => {
                  const e = (selectedSheet.work_entries||[]).find((x:any)=>x.day===day);
                  if (!e) return null;
                  let dm = 0;
                  if (e.start_time && e.end_time) { const[a,b]=e.start_time.split(":").map(Number); const[c,d]=e.end_time.split(":").map(Number); dm=c*60+d-(a*60+b); }
                  return (
                    <div key={day} className="flex items-center justify-between py-2 px-3 rounded-xl bg-brand-light/5 hover:bg-brand-gold/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-brand-dark w-8">{DL[day]}</span>
                        <span className="text-sm text-brand-soft">{e.work_description||"—"}</span>
                      </div>
                      <span className="text-xs font-mono text-brand-dark tabular-nums">{dm>0?fM(dm):"—"}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <a href={`/api/export-sheet/${selectedSheet.id}`} className="btn-secondary text-xs !py-1.5 !px-3">Exportar Word</a>
                {selectedSheet.status==="submitted" && (
                  <button onClick={()=>handleValidate(selectedSheet.id)} className="badge-submitted cursor-pointer hover:brightness-95 text-xs">Validar</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteUserButton userId={userId} userName={profile.full_name} />
    </div>
  );
}
