"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { format, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import toast from "react-hot-toast";
import type { WorkSheet, WorkEntry } from "@/lib/types";
import { calcMinutes, formatMinutes } from "@/lib/utils";

const DAYS = [
  { key: "monday", label: "2ª Feira" },
  { key: "tuesday", label: "3ª Feira" },
  { key: "wednesday", label: "4ª Feira" },
  { key: "thursday", label: "5ª Feira" },
  { key: "friday", label: "6ª Feira" },
  { key: "saturday", label: "Sábado" },
];
const WORK_TYPES = [
  { value: "", label: "— Selecionar —" },
  { value: "new_installation", label: "Nova Instalação" },
  { value: "installation_continuation", label: "Continuação instalação" },
  { value: "preventive_maintenance", label: "Manutenção preventiva" },
  { value: "corrective_maintenance", label: "Manutenção corretiva" },
];

function emptyEntry(day: string): WorkEntry {
  return { day, work_description: "", work_type: "", date: "", evaluation: "", signature: "", observations: "", start_time: "", end_time: "" };
}
function getWeekDates(ws: Date) {
  return DAYS.map((d, i) => ({ ...d, date: format(addDays(ws, i), "yyyy-MM-dd") }));
}

export default function SheetForm({ existingSheet }: { existingSheet?: WorkSheet | null }) {
  const router=useRouter();const supabase=createClient();const [saving,setSaving]=useState(false);const [submitting,setSubmitting]=useState(false);
  const today=new Date();const weekStart=startOfWeek(today,{weekStartsOn:1});
  const [client,setClient]=useState(existingSheet?.client||"");
  const [workNumber,setWorkNumber]=useState(existingSheet?.work_number||"");
  const [entries,setEntries]=useState<WorkEntry[]>(()=>{if(existingSheet?.entries?.length)return DAYS.map(d=>existingSheet.entries.find(e=>e.day===d.key)||emptyEntry(d.key));return DAYS.map(d=>emptyEntry(d.key));});
  const weekDates=getWeekDates(existingSheet?new Date(existingSheet.week_start+"T00:00:00"):weekStart);
  const upd=(dk:string,f:keyof WorkEntry,v:string)=>{setEntries(p=>p.map(e=>e.day===dk?{...e,[f]:v}:e));};

  const handleSave=async(status:"draft"|"submitted")=>{
    if(status==="submitted")setSubmitting(true);else setSaving(true);
    const{data:{user}}=await supabase.auth.getUser();if(!user){toast.error("Sessão expirada.");router.push("/auth/login");return;}
    const ws=weekDates[0].date;
    const payload={worker_id:user.id,week_start:ws,week_end:weekDates[5].date,client,work_number:workNumber,status};
    let sid=existingSheet?.id;
    if(sid){const{error}=await supabase.from("work_sheets").update(payload).eq("id",sid);if(error){toast.error("Erro: "+error.message);setSaving(false);setSubmitting(false);return;}}
    else{const{data,error}=await supabase.from("work_sheets").insert(payload).select("id").single();if(error){toast.error("Erro: "+error.message);setSaving(false);setSubmitting(false);return;}sid=data.id;}
    for(const e of entries){const ep={sheet_id:sid,day:e.day,work_description:e.work_description,work_type:e.work_type,date:e.date||weekDates.find(d=>d.key===e.day)?.date||null,evaluation:e.evaluation,signature:e.signature,observations:e.observations,start_time:e.start_time||null,end_time:e.end_time||null};if(e.id)await supabase.from("work_entries").update(ep).eq("id",e.id);else await supabase.from("work_entries").insert(ep);}
    toast.success(status==="submitted"?"Folha submetida!":"Rascunho guardado!");router.push("/worker/dashboard");router.refresh();
  };

  const mins = calcMinutes(entries);
  const hrs = Math.floor(mins / 60);
  const min = mins % 60;

  return(<div className="space-y-6">
    <div className="card"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"><div><h2 className="text-xl font-bold text-brand-dark">EQX Folha de Serviço</h2><p className="text-sm text-brand-soft mt-1">Semana de {format(new Date(weekDates[0].date+"T00:00:00"),"dd/MM",{locale:pt})} a {format(new Date(weekDates[5].date+"T00:00:00"),"dd/MM/yyyy",{locale:pt})}</p></div>{existingSheet&&<span className="badge-draft">{existingSheet.status==="draft"?"Rascunho":existingSheet.status==="submitted"?"Submetida":"Validada"}</span>}</div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"><div><label className="label-field">Cliente</label><input type="text" value={client} onChange={e=>setClient(e.target.value)} className="input-field" placeholder="Nome do cliente"/></div><div><label className="label-field">Nº Obra</label><input type="text" value={workNumber} onChange={e=>setWorkNumber(e.target.value)} className="input-field" placeholder="Número da obra"/></div></div>
    <div className="hidden lg:block overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-brand-light/30"><th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-20">Dia</th><th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide">Trabalho a executar</th><th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-36">Tipo</th><th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-28">Data</th><th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-24">Início</th><th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-24">Fim</th><th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-32">Avaliação</th><th className="text-left py-2 px-2 font-semibold text-brand-soft text-xs tracking-wide w-20">Rubrica</th></tr></thead><tbody>{entries.map((e,i)=>(<tr key={e.day} className="border-b border-brand-light/20 hover:bg-brand-gold/5"><td className="py-2 px-2 font-medium text-brand-dark">{DAYS[i].label}</td><td className="py-2 px-2"><input type="text" value={e.work_description} onChange={ev=>upd(e.day,"work_description",ev.target.value)} className="input-field !py-1.5 !px-2 text-xs" placeholder="Descrever..."/></td><td className="py-2 px-2"><select value={e.work_type} onChange={ev=>upd(e.day,"work_type",ev.target.value)} className="input-field !py-1.5 !px-2 text-xs">{WORK_TYPES.map(wt=>(<option key={wt.value} value={wt.value}>{wt.label}</option>))}</select></td><td className="py-2 px-2"><input type="date" value={e.date||weekDates[i].date} onChange={ev=>upd(e.day,"date",ev.target.value)} className="input-field !py-1.5 !px-2 text-xs"/></td><td className="py-2 px-2"><input type="time" value={e.start_time} onChange={ev=>upd(e.day,"start_time",ev.target.value)} className="input-field !py-1.5 !px-2 text-xs"/></td><td className="py-2 px-2"><input type="time" value={e.end_time} onChange={ev=>upd(e.day,"end_time",ev.target.value)} className="input-field !py-1.5 !px-2 text-xs"/></td><td className="py-2 px-2"><input type="text" value={e.evaluation} onChange={ev=>upd(e.day,"evaluation",ev.target.value)} className="input-field !py-1.5 !px-2 text-xs" placeholder="Após trabalho"/></td><td className="py-2 px-2"><input type="text" value={e.signature} onChange={ev=>upd(e.day,"signature",ev.target.value)} className="input-field !py-1.5 !px-2 text-xs" placeholder="Rubrica"/></td></tr>))}</tbody></table></div>
    <div className="lg:hidden space-y-4">{entries.map((e,i)=>(<div key={e.day} className="border border-brand-light/30 rounded-xl p-4 space-y-3"><h3 className="font-semibold text-brand-dark">{DAYS[i].label} — {weekDates[i].date}</h3><input type="text" value={e.work_description} onChange={ev=>upd(e.day,"work_description",ev.target.value)} className="input-field text-sm" placeholder="Trabalho a executar"/><div className="grid grid-cols-2 gap-3"><select value={e.work_type} onChange={ev=>upd(e.day,"work_type",ev.target.value)} className="input-field text-sm">{WORK_TYPES.map(wt=>(<option key={wt.value} value={wt.value}>{wt.label}</option>))}</select><input type="date" value={e.date||weekDates[i].date} onChange={ev=>upd(e.day,"date",ev.target.value)} className="input-field text-sm"/></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-brand-muted">Início</label><input type="time" value={e.start_time} onChange={ev=>upd(e.day,"start_time",ev.target.value)} className="input-field text-sm"/></div><div><label className="text-xs text-brand-muted">Fim</label><input type="time" value={e.end_time} onChange={ev=>upd(e.day,"end_time",ev.target.value)} className="input-field text-sm"/></div></div><div className="grid grid-cols-2 gap-3"><input type="text" value={e.evaluation} onChange={ev=>upd(e.day,"evaluation",ev.target.value)} className="input-field text-sm" placeholder="Avaliação"/><input type="text" value={e.signature} onChange={ev=>upd(e.day,"signature",ev.target.value)} className="input-field text-sm" placeholder="Rubrica"/></div><input type="text" value={e.observations} onChange={ev=>upd(e.day,"observations",ev.target.value)} className="input-field text-sm" placeholder="Observações"/></div>))}</div>
    <div className="hidden lg:block mt-4"><h4 className="text-sm font-semibold text-brand-soft mb-2">Observações</h4><div className="grid grid-cols-3 gap-2">{entries.map((e,i)=>(<div key={e.day}><label className="text-xs text-brand-muted">{DAYS[i].label}</label><input type="text" value={e.observations} onChange={ev=>upd(e.day,"observations",ev.target.value)} className="input-field !py-1.5 !px-2 text-xs" placeholder="Obs."/></div>))}</div></div>
    <div className="mt-6 pt-4 border-t border-brand-light/30 flex items-center justify-between"><p className="text-sm text-brand-soft">Total de horas esta semana: <span className="font-bold font-mono text-brand-dark">{hrs}h{min>0?` ${min}m`:""}</span></p></div></div>
    <div className="flex flex-col sm:flex-row gap-3 justify-end"><button type="button" onClick={()=>handleSave("draft")} disabled={saving||submitting} className="btn-secondary">{saving?"A guardar...":"Guardar rascunho"}</button><button type="button" onClick={()=>handleSave("submitted")} disabled={submitting||saving} className="btn-primary">{submitting?"A submeter...":"Submeter folha"}</button></div>
  </div>);
}
