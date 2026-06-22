"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, startOfWeek } from "date-fns";
import { pt } from "date-fns/locale";
import MonthCalendar from "@/components/MonthCalendar";
import DeleteUserButton from "./DeleteUserButton";
import toast from "react-hot-toast";
import { markAsReviewed } from "@/app/hr/actions";
import { calcMinutes, formatMinutes } from "@/lib/utils";
import { DAY_LABELS } from "@/lib/types";

const DL = DAY_LABELS;

export default function UserProfileClient({ userId, profile, sheets: initialSheets, userEmail }: { userId: string; profile: any; sheets: any[]; userEmail: string }) {
  const [sheets] = useState(initialSheets);
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const supabase = createClient();

  const [editName, setEditName] = useState(profile.full_name);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editPassword, setEditPassword] = useState("");
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [workerProjects, setWorkerProjects] = useState<any[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    supabase.from("projects").select("id,name,client:clients(name)").order("name").then(({data}) => setAllProjects(data||[]));
    const pids = new Set(initialSheets.map(s => s.project_id).filter(Boolean));
    if (pids.size > 0) supabase.from("projects").select("id,name,client:clients(name)").in("id", Array.from(pids)).then(({data}) => setWorkerProjects(data||[]));
  }, []);

  // Find sheet by calendar-selected Sunday → compare to sheet week_start (Monday)
  const findSheet = useCallback((sunday: Date) => {
    const monday = format(addDays(sunday, 1), "yyyy-MM-dd");
    return sheets.find((s: any) => s.week_start === monday) || null;
  }, [sheets]);

  const handleWeekSelect = (sunday: Date) => {
    setSelectedWeek(sunday);
    setSelectedSheet(findSheet(sunday));
  };

  const totalMins = sheets.reduce((s: number, sh: any) => s + calcMinutes(sh.work_entries || []), 0);
  const latestSheet = sheets[0];

  // Calendar sheets map: use Sunday-based weekStart for highlighting
  const sheetSundays = new Map<string, any>();
  for (const s of sheets) {
    const sun = format(addDays(new Date(s.week_start+"T00:00:00"), -1), "yyyy-MM-dd");
    sheetSundays.set(sun, s);
  }

  const sheetWeeks = sheets.map((s: any) => {
    const sun = addDays(new Date(s.week_start+"T00:00:00"), -1);
    return { weekStart: sun, weekEnd: addDays(sun, 6), hasSheet: true, sheetId: s.id, status: s.status };
  });

  const handleValidate = async (sheetId: string) => {
    const result = await markAsReviewed(sheetId);
    if (result.success) { setSelectedSheet((prev: any) => prev?.id===sheetId ? {...prev,status:"reviewed"} : prev); toast.success("Validada!"); }
    else toast.error(result.error || "Erro ao validar");
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    if (editName !== profile.full_name) await fetch("/api/update-profile", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId,full_name:editName}) });
    if (editEmail !== userEmail || editPassword) {
      const r = await fetch("/api/update-user", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId,email:editEmail!==userEmail?editEmail:null,password:editPassword||null}) });
      const d = await r.json();
      if (d.error) { toast.error(d.error); setEditSaving(false); return; }
    }
    toast.success("Guardado!");
    setEditSaving(false); setShowEdit(false); setEditPassword("");
  };

  return (
    <div className="space-y-6">
      {/* Top card: name + stats + obras below name */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark">{profile.full_name}</h2>
            <p className="text-sm text-brand-dark font-medium mt-0.5">{userEmail || "Sem email"}</p>
            {/* Obras below name */}
            <div className="flex flex-wrap gap-2 mt-3">
              {workerProjects.map((p: any) => (
                <span key={p.id} className="text-xs bg-brand-gold/10 text-brand-dark font-medium px-2.5 py-1 rounded-full">{p.name}</span>
              ))}
              {workerProjects.length===0 && <span className="text-xs text-brand-muted">Nenhuma obra</span>}
            </div>
          </div>
          <div className="flex gap-8 text-right shrink-0">
            <div><span className="block text-3xl font-bold font-mono text-brand-dark tracking-tight">{formatMinutes(totalMins)}</span><span className="text-xs text-brand-muted tracking-wide uppercase">Horas totais</span></div>
            <div><span className="block text-3xl font-bold font-mono text-brand-dark tracking-tight">{sheets.length}</span><span className="text-xs text-brand-muted tracking-wide uppercase">Folhas</span></div>
            <div><span className="block text-3xl font-bold font-mono text-brand-dark tracking-tight">{latestSheet?format(new Date(latestSheet.week_start+"T00:00:00"),"dd/MM",{locale:pt}):"—"}</span><span className="text-xs text-brand-muted tracking-wide uppercase">Última folha</span></div>
          </div>
        </div>
        <button onClick={() => { setEditName(profile.full_name); setEditEmail(userEmail); setShowEdit(true); }} className="btn-secondary text-xs !py-1.5 !px-3 mt-4">Editar</button>
      </div>

      {/* Calendar + Sheet detail side by side */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="card !p-4 w-full lg:w-[280px] lg:h-[280px] shrink-0 flex items-center justify-center">
          <MonthCalendar sheets={sheetWeeks} selectedWeek={selectedWeek} onSelectWeek={handleWeekSelect} />
        </div>

        {/* Sheet detail to the right */}
        <div className="card !p-4 flex-1 min-h-[280px]">
          {!selectedWeek ? (
            <div className="text-center py-16 text-brand-muted text-sm">Selecione uma semana no calendário</div>
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
              <div className="space-y-1.5">{["monday","tuesday","wednesday","thursday","friday","saturday"].map(day=>{const e=(selectedSheet.work_entries||[]).find((x:any)=>x.day===day);if(!e)return null;let dm=0;if(e.start_time&&e.end_time){const[a,b]=e.start_time.split(":").map(Number);const[c,d]=e.end_time.split(":").map(Number);dm=c*60+d-(a*60+b);}return(<div key={day} className="flex items-center justify-between py-2 px-3 rounded-xl bg-brand-light/5"><div className="flex items-center gap-3"><span className="text-xs font-semibold text-brand-dark w-8">{DL[day]}</span><span className="text-sm text-brand-soft">{e.work_description||"—"}</span></div><span className="text-xs font-mono text-brand-dark">{dm>0?formatMinutes(dm):"—"}</span></div>);})}</div>
              <div className="flex gap-2 pt-2">
                <a href={`/api/export-sheet/${selectedSheet.id}`} className="btn-secondary text-xs !py-1.5 !px-3">Exportar Word</a>
                {selectedSheet.status==="submitted"&&<button onClick={()=>handleValidate(selectedSheet.id)} className="badge-submitted cursor-pointer hover:brightness-95 text-xs">Validar</button>}
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteUserButton userId={userId} userName={profile.full_name} />

      {showEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 overflow-y-auto py-8" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-brand-dark">Editar {profile.full_name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label-field">Nome</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field" /></div>
              <div><label className="label-field">Email</label><input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="input-field" /></div>
              <div className="sm:col-span-2"><label className="label-field">Nova password (opcional)</label><input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="input-field" placeholder="Deixar vazio = manter atual" minLength={6} /></div>
            </div>
            <div>
              <label className="label-field">Obras</label>
              <div className="flex flex-wrap gap-2 mb-2">{workerProjects.map((p:any)=>(<span key={p.id} className="text-xs bg-brand-gold/10 text-brand-dark font-medium px-2.5 py-1 rounded-full flex items-center gap-1">{p.name}<button onClick={() => setWorkerProjects(prev => prev.filter(x => x.id !== p.id))} className="text-brand-muted hover:text-red-500 ml-1 font-bold">&times;</button></span>))}</div>
              <select onChange={e => { if(e.target.value && !workerProjects.find(p=>p.id===e.target.value)) { const p = allProjects.find(x=>x.id===e.target.value); if(p) setWorkerProjects(prev => [...prev, p]); e.target.value=""; } }} defaultValue="" className="input-field text-sm"><option value="">Adicionar obra…</option>{allProjects.filter(p => !workerProjects.some(wp => wp.id === p.id)).map((p:any) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            </div>
            <div className="flex gap-3 justify-end pt-2"><button onClick={() => setShowEdit(false)} className="btn-secondary !py-2 !px-4 text-sm">Cancelar</button><button onClick={handleSaveEdit} disabled={editSaving} className="btn-primary !py-2 !px-4 text-sm">{editSaving?"A guardar…":"Guardar"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
