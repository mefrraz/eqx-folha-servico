import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns"; import { pt } from "date-fns/locale"; import { notFound } from "next/navigation";
import EditUserForm from "./EditUserForm"; import ValidateButton from "../../dashboard/ValidateButton";
export const dynamic = "force-dynamic";
const DL:Record<string,string>={monday:"2ª",tuesday:"3ª",wednesday:"4ª",thursday:"5ª",friday:"6ª",saturday:"Sáb"};
const WT:Record<string,string>={new_installation:"Nova Instalação",installation_continuation:"Continuação",preventive_maintenance:"Manut. preventiva",corrective_maintenance:"Manut. corretiva"};
function cM(e:any[]){return e.reduce((s:number,x:any)=>{if(x.start_time&&x.end_time){const[a,b]=x.start_time.split(":").map(Number);const[c,d]=x.end_time.split(":").map(Number);return s+(c*60+d)-(a*60+b)}return s},0);}
function fM(m:number){const h=Math.floor(m/60);const mi=m%60;return mi?`${h}h ${mi}m`:`${h}h`;}

export default async function UserProfile({ params }: { params: { id: string } }) {
  const sup=await createClient();
  const{data:p}=await sup.from("profiles").select("*").eq("id",params.id).single(); if(!p)notFound();
  const{data:sheets}=await sup.from("work_sheets").select("*,work_entries(*)").eq("worker_id",params.id).order("week_start",{ascending:false}).limit(60);
  const tM=(sheets||[]).reduce((s,sh)=>s+cM(sh.work_entries||[]),0);
  return(<div className="space-y-6">
    <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h2 className="text-xl font-bold text-brand-dark">{p.full_name}</h2><p className="text-xs font-mono text-brand-muted mt-0.5">{params.id}</p></div><div className="flex items-center gap-6"><div className="text-right"><span className="stat-value text-lg">{fM(tM)}</span><span className="stat-label ml-1">horas</span></div><div className="text-right"><span className="stat-value text-lg">{sheets?.length||0}</span><span className="stat-label ml-1">folhas</span></div></div></div>
    <EditUserForm userId={params.id} fullName={p.full_name}/>
    <div className="space-y-3"><h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Folhas</h4>{!sheets||sheets.length===0?<div className="card text-center py-8 text-brand-muted text-sm">Nenhuma folha.</div>:sheets.map(s=>{const m=cM(s.work_entries||[]);return(<details key={s.id} className="card !p-4"><summary className="cursor-pointer list-none flex items-center justify-between"><div><span className="font-medium text-brand-dark text-sm">Sem. {format(new Date(s.week_start+"T00:00:00"),"dd/MM",{locale:pt})}–{format(new Date(s.week_end+"T00:00:00"),"dd/MM/yy",{locale:pt})}</span><span className="text-xs text-brand-soft ml-3">{s.client||"—"} · {s.work_number||"—"}</span></div><div className="flex items-center gap-3"><span className="text-xs font-mono text-brand-dark">{fM(m)}</span><ValidateButton sheetId={s.id} currentStatus={s.status}/></div></summary><table className="w-full text-xs mt-3"><thead><tr className="text-brand-soft border-b border-brand-light/30"><th className="text-left py-1.5">Dia</th><th className="text-left py-1.5">Trabalho</th><th className="text-left py-1.5">Tipo</th><th className="text-right py-1.5">Horas</th></tr></thead><tbody>{["monday","tuesday","wednesday","thursday","friday","saturday"].map(day=>{const e=(s.work_entries||[]).find((x:any)=>x.day===day);if(!e)return null;let dm=0;if(e.start_time&&e.end_time){const[a,b]=e.start_time.split(":").map(Number);const[c,d]=e.end_time.split(":").map(Number);dm=c*60+d-(a*60+b);}return(<tr key={day} className="border-b border-brand-light/20"><td className="py-1.5 font-medium text-brand-dark">{DL[day]}</td><td className="py-1.5 text-brand-soft">{e.work_description||"—"}</td><td className="py-1.5 text-brand-muted">{WT[e.work_type]||"—"}</td><td className="py-1.5 text-right font-mono text-brand-dark">{dm>0?fM(dm):"—"}</td></tr>);})}</tbody></table></details>);})}</div>
  </div>);
}
