"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { pt } from "date-fns/locale";
import MonthCalendar from "@/components/MonthCalendar";
import DeleteUserButton from "./DeleteUserButton";
import toast from "react-hot-toast";

const DL:Record<string,string>={monday:"2ª",tuesday:"3ª",wednesday:"4ª",thursday:"5ª",friday:"6ª",saturday:"Sáb"};
function cM(e:any[]){return e.reduce((s:number,x:any)=>{if(x.start_time&&x.end_time){const[a,b]=x.start_time.split(":").map(Number);const[c,d]=x.end_time.split(":").map(Number);return s+(c*60+d)-(a*60+b)}return s},0);}
function fM(m:number){const h=Math.floor(m/60);const mi=m%60;return mi?`${h}h ${mi}m`:`${h}h`;}

export default function UserProfileClient({ userId, profile, sheets: initialSheets }: { userId: string; profile: any; sheets: any[] }) {
  const [sheets] = useState(initialSheets);
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const supabase = createClient();

  const [editName, setEditName] = useState(profile.full_name);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [workerProjects, setWorkerProjects] = useState<any[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    supabase.from("projects").select("id,name,client:clients(name)").order("name").then(({data}) => setAllProjects(data||[]));
    const pids = new Set(initialSheets.map(s => s.project_id).filter(Boolean));
    if (pids.size > 0) supabase.from("projects").select("id,name,client:clients(name)").in("id", Array.from(pids)).then(({data}) => setWorkerProjects(data||[]));
  }, []);

  const findSheet = useCallback((weekStart: Date) => {
    const ws = format(weekStart, "yyyy-MM-dd");
    return sheets.find((s: any) => s.week_start === ws) || null;
  }, [sheets]);

  useEffect(() => {
    if (selectedWeek) {
      setSelectedSheet(findSheet(selectedWeek));
    }
  }, [selectedWeek, findSheet]);

  const totalMins = sheets.reduce((s: number, sh: any) => s + cM(sh.work_entries || []), 0);
  const latestSheet = sheets[0];
  const uniqueWeeks = new Set(sheets.map((s: any) => s.week_start)).size;
  const avgHoursPerWeek = uniqueWeeks > 0 ? Math.round((totalMins / 60) / uniqueWeeks) : 0;
  const uniqueProjects = new Set(sheets.map((s: any) => s.project_id).filter(Boolean)).size;

  const sheetWeeks = sheets.map((s: any) => ({
    weekStart: new Date(s.week_start+"T00:00:00"),
    weekEnd: new Date(s.week_end+"T00:00:00"),
    hasSheet: true, sheetId: s.id, status: s.status
  }));

  const handleValidate = async (sheetId: string) => {
    const r = await fetch("/api/validate-sheet", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({sheetId}) });
    const d = await r.json();
    if (d.error) toast.error(d.error); else { setSelectedSheet((prev: any) => prev?.id === sheetId ? {...prev, status:"reviewed"} : prev); toast.success("Validada!"); }
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    let err = false;
    if (editName !== profile.full_name) { const r = await fetch("/api/update-profile", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId,full_name:editName}) }); if (!(await r.json()).success) { toast.error("Erro no nome"); err=true; } }
    if (editEmail || editPassword) {
      const r = await fetch("/api/update-user", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId,email:editEmail||undefined,password:editPassword||undefined}) });
      if (!(await r.json()).success) { toast.error("Erro no email/password"); err=true; }
    }
    if (!err) toast.success("Guardado!");
    setEditSaving(false); setShowEdit(false); setEditPassword(""); setEditEmail("");
  };

  const removeProject = (projectId: string) => {
    setWorkerProjects(prev => prev.filter(p => p.id !== projectId));
  };

  return (
    <div className="space-y-6">
      {/* Top — read-only */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark">{profile.full_name}</h2>
            <p className="text-xs font-mono text-brand-muted mt-1">{userId}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {workerProjects.map((p: any) => (
                <span key={p.id} className="text-xs bg-brand-gold/10 text-brand-dark font-medium px-2.5 py-1 rounded-full">{p.name}</span>
              ))}
              {workerProjects.length === 0 && <span className="text-xs text-brand-muted">Nenhuma obra</span>}
            </div>
          </div>
          <div className="flex gap-8 text-right shrink-0">
            <div><span className="block text-3xl font-bold font-mono text-brand-dark tracking-tight">{fM(totalMins)}</span><span className="text-xs text-brand-muted tracking-wide uppercase">Horas totais</span></div>
            <div><span className="block text-3xl font-bold font-mono text-brand-dark tracking-tight">{sheets.length}</span><span className="text-xs text-brand-muted tracking-wide uppercase">Folhas</span></div>
            <div><span className="block text-3xl font-bold font-mono text-brand-dark tracking-tight">{latestSheet ? format(new Date(latestSheet.week_start+"T00:00:00"), "dd/MM", {locale:pt}) : "—"}</span><span className="text-xs text-brand-muted tracking-wide uppercase">Última folha</span></div>
          </div>
        </div>
        <button onClick={() => { setEditName(profile.full_name); setShowEdit(true); }} className="btn-secondary text-xs !py-1.5 !px-3 mt-4">Editar</button>
      </div>

      {/* Calendar + Stats | Sheet detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Stats + Calendar */}
        <div className="lg:col-span-2 space-y-3">
          {/* Stats mini cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="card !p-3 text-center">
              <span className="block text-lg font-bold font-mono text-brand-dark">{fM(totalMins)}</span>
              <span className="text-[10px] text-brand-muted">Total horas</span>
            </div>
            <div className="card !p-3 text-center">
              <span className="block text-lg font-bold font-mono text-brand-dark">{avgHoursPerWeek}h</span>
              <span className="text-[10px] text-brand-muted">Média/semana</span>
            </div>
            <div className="card !p-3 text-center">
              <span className="block text-lg font-bold font-mono text-brand-dark">{uniqueWeeks}</span>
              <span className="text-[10px] text-brand-muted">Semanas</span>
            </div>
            <div className="card !p-3 text-center">
              <span className="block text-lg font-bold font-mono text-brand-dark">{uniqueProjects}</span>
              <span className="text-[10px] text-brand-muted">Obras</span>
            </div>
          </div>
          {/* Calendar */}
          <div className="card !p-3">
            <MonthCalendar sheets={sheetWeeks} selectedWeek={selectedWeek} onSelectWeek={(d) => { setSelectedWeek(d); setSelectedSheet(findSheet(d)); }} />
          </div>
        </div>

        {/* Right: Sheet detail */}
        <div className="lg:col-span-3">
          <div className="card !p-4 min-h-[300px]">
            {!selectedWeek ? (
              <div className="text-center py-16 text-brand-muted text-sm">Selecione uma semana</div>
            ) : !selectedSheet ? (
              <div className="text-center py-16">
                <p className="text-brand-muted text-sm mb-2">Nenhuma folha esta semana</p>
                <p className="text-xs text-brand-soft">{format(selectedWeek,"dd/MM",{locale:pt})} – {format(addDays(selectedWeek,6),"dd/MM/yyyy",{locale:pt})}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-brand-dark">Semana {format(new Date(selectedSheet.week_start+"T00:00:00"),"dd/MM",{locale:pt})} – {format(new Date(selectedSheet.week_end+"T00:00:00"),"dd/MM/yy",{locale:pt})}</h4>
                  <span className={selectedSheet.status==="draft"?"badge-draft":selectedSheet.status==="submitted"?"badge-submitted":"badge-reviewed"}>{selectedSheet.status==="draft"?"Rascunho":selectedSheet.status==="submitted"?"Submetida":"Validada"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm"><div><span className="text-xs text-brand-muted">Cliente</span><p className="text-brand-dark font-medium">{selectedSheet.client||"—"}</p></div><div><span className="text-xs text-brand-muted">Obra</span><p className="text-brand-dark font-medium">{selectedSheet.work_number||"—"}</p></div></div>
                <div className="text-center py-3 bg-brand-gold/5 rounded-xl"><span className="text-2xl font-bold font-mono text-brand-dark tracking-tight">{fM(cM(selectedSheet.work_entries||[]))}</span><p className="text-xs text-brand-soft mt-1">Horas trabalhadas</p></div>
                <div className="space-y-1.5">
                  {["monday","tuesday","wednesday","thursday","friday","saturday"].map(day=>{const e=(selectedSheet.work_entries||[]).find((x:any)=>x.day===day);if(!e)return null;let dm=0;if(e.start_time&&e.end_time){const[a,b]=e.start_time.split(":").map(Number);const[c,d]=e.end_time.split(":").map(Number);dm=c*60+d-(a*60+b);}return(<div key={day} className="flex items-center justify-between py-2 px-3 rounded-xl bg-brand-light/5"><div className="flex items-center gap-3"><span className="text-xs font-semibold text-brand-dark w-8">{DL[day]}</span><span className="text-sm text-brand-soft">{e.work_description||"—"}</span></div><span className="text-xs font-mono text-brand-dark">{dm>0?fM(dm):"—"}</span></div>);})}
                </div>
                <div className="flex gap-2 pt-2">
                  <a href={`/api/export-sheet/${selectedSheet.id}`} className="btn-secondary text-xs !py-1.5 !px-3">Exportar Word</a>
                  {selectedSheet.status==="submitted"&&<button onClick={()=>handleValidate(selectedSheet.id)} className="badge-submitted cursor-pointer hover:brightness-95 text-xs">Validar</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteUserButton userId={userId} userName={profile.full_name} />

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-brand-dark">Editar {profile.full_name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label-field">Nome</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field" /></div>
              <div><label className="label-field">Novo email</label><input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="input-field" placeholder="Manter actual" /></div>
              <div className="sm:col-span-2"><label className="label-field">Nova password</label><input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="input-field" placeholder="Mín. 6 caracteres" minLength={6} /></div>
            </div>
            <div>
              <label className="label-field">Obras</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {workerProjects.map((p:any)=>(
                  <span key={p.id} className="text-xs bg-brand-gold/10 text-brand-dark font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    {p.name}
                    <button onClick={() => removeProject(p.id)} className="text-brand-muted hover:text-red-500 ml-1 font-bold">&times;</button>
                  </span>
                ))}
                {workerProjects.length === 0 && <span className="text-xs text-brand-muted">Nenhuma obra</span>}
              </div>
              <select onChange={e => { if(e.target.value && !workerProjects.find(p=>p.id===e.target.value)) { const p = allProjects.find(x=>x.id===e.target.value); if(p) setWorkerProjects(prev => [...prev, p]); e.target.value=""; } }} defaultValue="" className="input-field text-sm">
                <option value="">Adicionar obra…</option>
                {allProjects.filter(p => !workerProjects.some(wp => wp.id === p.id)).map((p:any) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowEdit(false)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button>
              <button onClick={handleSaveEdit} disabled={editSaving} className="btn-primary !py-2 !px-4 text-sm">{editSaving?"A guardar…":"Guardar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
