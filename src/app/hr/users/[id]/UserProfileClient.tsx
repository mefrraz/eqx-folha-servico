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
  const [showFull, setShowFull] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (selectedWeek) {
      const ws = format(selectedWeek, "yyyy-MM-dd");
      const found = sheets.find((s: any) => s.week_start === ws);
      setSelectedSheet(found || null);
    }
  }, [selectedWeek, sheets]);

  const sheetWeeks = sheets.map((s: any) => ({
    weekStart: new Date(s.week_start + "T00:00:00"),
    weekEnd: new Date(s.week_end + "T00:00:00"),
    hasSheet: true,
    sheetId: s.id,
    hours: fM(cM(s.work_entries || [])),
    status: s.status,
  }));

  const totalMins = sheets.reduce((s: number, sh: any) => s + cM(sh.work_entries || []), 0);

  const handleValidate = async (sheetId: string) => {
    const res = await fetch("/api/validate-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId }),
    });
    const data = await res.json();
    if (data.error) toast.error(data.error);
    else {
      setSheets(prev => prev.map(s => s.id === sheetId ? { ...s, status: "reviewed" } : s));
      toast.success("Validada!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">{profile.full_name}</h2>
          <p className="text-xs font-mono text-brand-muted mt-0.5">{userId}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right"><span className="stat-value text-lg">{fM(totalMins)}</span><span className="stat-label ml-1">horas</span></div>
          <div className="text-right"><span className="stat-value text-lg">{sheets.length}</span><span className="stat-label ml-1">folhas</span></div>
        </div>
      </div>

      <EditUserForm userId={userId} fullName={profile.full_name} />
      <DeleteUserButton userId={userId} userName={profile.full_name} />

      {/* Calendar + Sheet detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <MonthCalendar sheets={sheetWeeks} selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />
        </div>

        <div className="card min-h-[200px]">
          {!selectedWeek ? (
            <div className="text-center py-12 text-brand-muted text-sm">Selecione uma semana no calendário</div>
          ) : !selectedSheet ? (
            <div className="text-center py-12">
              <p className="text-brand-muted text-sm mb-2">Nenhuma folha esta semana</p>
              <p className="text-xs text-brand-soft">{format(selectedWeek, "dd/MM", { locale: pt })} – {format(addDays(selectedWeek, 5), "dd/MM/yyyy", { locale: pt })}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-brand-dark">
                  Semana {format(new Date(selectedSheet.week_start+"T00:00:00"), "dd/MM", { locale: pt })} – {format(new Date(selectedSheet.week_end+"T00:00:00"), "dd/MM/yy", { locale: pt })}
                </h4>
                <span className={selectedSheet.status === "draft" ? "badge-draft" : selectedSheet.status === "submitted" ? "badge-submitted" : "badge-reviewed"}>
                  {selectedSheet.status === "draft" ? "Rascunho" : selectedSheet.status === "submitted" ? "Submetida" : "Validada"}
                </span>
              </div>
              <p className="text-xs text-brand-soft">{selectedSheet.client || "—"} · {selectedSheet.work_number || "—"}</p>
              <p className="text-sm font-mono text-brand-dark">{fM(cM(selectedSheet.work_entries || []))}</p>

              <table className="w-full text-xs">
                <thead><tr className="text-brand-soft border-b border-brand-light/30"><th className="text-left py-1">Dia</th><th className="text-left py-1">Trabalho</th><th className="text-right py-1">Horas</th></tr></thead>
                <tbody>{["monday","tuesday","wednesday","thursday","friday","saturday"].map(day=>{const e=(selectedSheet.work_entries||[]).find((x:any)=>x.day===day);if(!e)return null;let dm=0;if(e.start_time&&e.end_time){const[a,b]=e.start_time.split(":").map(Number);const[c,d]=e.end_time.split(":").map(Number);dm=c*60+d-(a*60+b);}return(<tr key={day} className="border-b border-brand-light/20"><td className="py-1 font-medium">{DL[day]}</td><td className="py-1 text-brand-soft">{e.work_description||"—"}</td><td className="py-1 text-right font-mono">{dm>0?fM(dm):"—"}</td></tr>);})}</tbody>
              </table>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowFull(true)} className="btn-secondary text-xs !py-1.5 !px-3">Ver folha completa</button>
                <a href={`/api/export-sheet/${selectedSheet.id}`} className="btn-ghost text-xs !py-1.5 !px-3">Exportar Word</a>
                {selectedSheet.status === "submitted" && (
                  <button onClick={() => handleValidate(selectedSheet.id)} className="badge-submitted cursor-pointer hover:brightness-95 text-xs">Validar</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full sheet modal */}
      {showFull && selectedSheet && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8" onClick={() => setShowFull(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-dark">Folha de Serviço</h3>
              <button onClick={() => setShowFull(false)} className="btn-ghost text-xs">Fechar</button>
            </div>
            <p className="text-xs text-brand-soft mb-4">
              Semana {format(new Date(selectedSheet.week_start+"T00:00:00"),"dd/MM",{locale:pt})} – {format(new Date(selectedSheet.week_end+"T00:00:00"),"dd/MM/yy",{locale:pt})}
              &nbsp;· {selectedSheet.client || "—"} · {selectedSheet.work_number || "—"}
            </p>
            <table className="w-full text-sm">
              <thead><tr className="text-brand-soft border-b border-brand-light/30"><th className="text-left py-2">Dia</th><th className="text-left py-2">Trabalho</th><th className="text-left py-2">Tipo</th><th className="text-left py-2">Início</th><th className="text-left py-2">Fim</th><th className="text-left py-2">Aval.</th><th className="text-left py-2">Rubrica</th></tr></thead>
              <tbody>{["monday","tuesday","wednesday","thursday","friday","saturday"].map(day=>{const e=(selectedSheet.work_entries||[]).find((x:any)=>x.day===day);if(!e)return(<tr key={day} className="border-b border-brand-light/20"><td className="py-2 font-medium">{DL[day]}</td><td colSpan={6} className="py-2 text-brand-muted">—</td></tr>);return(<tr key={day} className="border-b border-brand-light/20"><td className="py-2 font-medium">{DL[day]}</td><td className="py-2 text-brand-soft">{e.work_description||"—"}</td><td className="py-2 text-brand-muted">{WT[e.work_type]||"—"}</td><td className="py-2 font-mono">{e.start_time||"—"}</td><td className="py-2 font-mono">{e.end_time||"—"}</td><td className="py-2">{e.evaluation||"—"}</td><td className="py-2">{e.signature ? <img src={e.signature} alt="Rubrica" className="h-8 w-auto rounded" /> : "—"}</td></tr>);})}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
