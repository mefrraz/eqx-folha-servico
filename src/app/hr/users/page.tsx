import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import AddUserButton from "./AddUserButton";

export const dynamic = "force-dynamic";
function cM(e:any[]){return e.reduce((s:number,x:any)=>{if(x.start_time&&x.end_time){const[a,b]=x.start_time.split(":").map(Number);const[c,d]=x.end_time.split(":").map(Number);return s+(c*60+d)-(a*60+b)}return s},0);}
function fM(m:number){const h=Math.floor(m/60);const mi=m%60;return mi?`${h}h ${mi}m`:`${h}h`;}

export default async function UsersPage() {
  const sup=await createClient();
  const{data:workers}=await sup.from("profiles").select("id,full_name,created_at").eq("role","worker").order("full_name");
  const{data:sheets}=await sup.from("work_sheets").select("worker_id,week_start,work_entries(*)").order("week_start",{ascending:false}).limit(500);
  const latest=new Map<string,any>();for(const s of sheets||[]){if(!latest.has(s.worker_id))latest.set(s.worker_id,s);}

  return(<div className="space-y-4">
    <div className="flex items-center justify-between">
      <div><h2 className="text-lg font-bold text-brand-dark">Utilizadores</h2><p className="text-sm text-brand-soft mt-0.5">{workers?.length||0} trabalhadores</p></div>
      <AddUserButton />
    </div>
  <div className="card !p-0 overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-brand-light/30 bg-brand-gold/5"><th className="text-left py-3 px-4 font-semibold text-brand-dark text-xs tracking-wide">Nome</th><th className="text-left py-3 px-4 font-semibold text-brand-dark text-xs tracking-wide hidden sm:table-cell">Última folha</th><th className="text-left py-3 px-4 font-semibold text-brand-dark text-xs tracking-wide hidden md:table-cell">Horas</th><th className="text-left py-3 px-4 font-semibold text-brand-dark text-xs tracking-wide hidden lg:table-cell">Registo</th></tr></thead><tbody>{(workers||[]).map(w=>{const l=latest.get(w.id);const m=cM(l?.work_entries||[]);return(<tr key={w.id} className="border-b border-brand-light/20 hover:bg-brand-gold/5 transition-colors"><td className="py-3 px-4"><Link href={`/hr/users/${w.id}`} className="text-brand-dark hover:text-brand-gold font-medium">{w.full_name}</Link></td><td className="py-3 px-4 text-brand-soft hidden sm:table-cell font-mono text-xs">{l?format(new Date(l.week_start+"T00:00:00"),"dd/MM/yy",{locale:pt}):"—"}</td><td className="py-3 px-4 text-brand-dark hidden md:table-cell font-mono text-xs">{l?fM(m):"—"}</td><td className="py-3 px-4 text-brand-muted hidden lg:table-cell text-xs font-mono">{format(new Date(w.created_at),"dd/MM/yy",{locale:pt})}</td></tr>);})}</tbody></table>{(!workers||workers.length===0)&&<div className="text-center py-12 text-brand-muted text-sm">Nenhum utilizador.</div>}</div></div>);
}
