import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";
function cM(e:any[]){return e.reduce((s:number,x:any)=>{if(x.start_time&&x.end_time){const[a,b]=x.start_time.split(":").map(Number);const[c,d]=x.end_time.split(":").map(Number);return s+(c*60+d)-(a*60+b)}return s},0);}
function fM(m:number){const h=Math.floor(m/60);const mi=m%60;return mi?`${h}h ${mi}m`:`${h}h`;}
const ST:Record<string,string>={draft:"Rascunho",submitted:"Submetida",reviewed:"Validada"};

export default async function WorkerDashboard() {
  const sup=await createClient();const{data:{user}}=await sup.auth.getUser();
  const{data:sheets}=await sup.from("work_sheets").select("*,work_entries(*)").eq("worker_id",user!.id).order("week_start",{ascending:false}).limit(30);
  const ws=format(startOfWeek(new Date(),{weekStartsOn:1}),"yyyy-MM-dd");
  const current=sheets?.find(s=>s.week_start===ws);

  return(<div className="space-y-6">
    <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div><h2 className="text-lg font-bold text-brand-dark">Semana de {format(startOfWeek(new Date(),{weekStartsOn:1}),"dd/MM",{locale:pt})} a {format(addDays(startOfWeek(new Date(),{weekStartsOn:1}),5),"dd/MM/yyyy",{locale:pt})}</h2><p className="text-sm text-brand-soft mt-0.5">{current?`Folha ${ST[current.status]||current.status}`:"Ainda não submeteu a folha desta semana."}</p></div>
      {current?<Link href={`/worker/sheet/${current.id}`} className="btn-primary text-sm">Editar folha</Link>:<Link href="/worker/sheet/new" className="btn-primary text-sm">Nova folha de serviço</Link>}
    </div>
    <div><h3 className="text-sm font-semibold text-brand-soft tracking-wide uppercase mb-3">Folhas anteriores</h3>{!sheets||sheets.length===0?<div className="card text-center py-10 text-brand-muted text-sm">Nenhuma folha.</div>:<div className="grid gap-2">{sheets.map(s=>{const m=cM(s.work_entries||[]);return(<Link key={s.id} href={`/worker/sheet/${s.id}`} className="card !p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:border-brand-gold/40 transition-all"><div><p className="font-medium text-brand-dark text-sm">Semana {format(new Date(s.week_start+"T00:00:00"),"dd/MM",{locale:pt})}–{format(new Date(s.week_end+"T00:00:00"),"dd/MM/yy",{locale:pt})}</p><p className="text-xs text-brand-soft">{s.client||"—"} · {s.work_number||"—"}</p></div><div className="flex items-center gap-3"><span className="font-mono text-sm text-brand-dark">{fM(m)}</span><span className={s.status==="draft"?"badge-draft":s.status==="submitted"?"badge-submitted":"badge-reviewed"}>{ST[s.status]||s.status}</span></div></Link>);})}</div>}</div>
  </div>);
}
