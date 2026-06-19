import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";

export const dynamic = "force-dynamic";

function calcM(e:any[]){return e.reduce((s:number,x:any)=>{if(x.start_time&&x.end_time){const[a,b]=x.start_time.split(":").map(Number);const[c,d]=x.end_time.split(":").map(Number);return s+(c*60+d)-(a*60+b)}return s},0);}
function fmtM(m:number){const h=Math.floor(m/60);const mi=m%60;return mi?`${h}h ${mi}m`:`${h}h`;}

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: sheets } = await supabase.from("work_sheets").select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)").order("week_start",{ascending:false}).limit(500);

  const map = new Map<string,{sheets:any[];workers:Set<string>;mins:number;latest:string}>();
  for(const s of sheets||[]){const k=s.work_number||"Sem obra";if(!map.has(k))map.set(k,{sheets:[],workers:new Set(),mins:0,latest:s.week_start});const p=map.get(k)!;p.sheets.push(s);p.workers.add(s.worker_id);p.mins+=calcM(s.work_entries||[]);if(s.week_start>p.latest)p.latest=s.week_start;}
  const projects = Array.from(map.entries()).sort((a,b)=>b[1].latest.localeCompare(a[1].latest));

  return (
    <div className="space-y-4">
      <div><h2 className="text-lg font-bold text-brand-dark">Obras</h2><p className="text-sm text-brand-soft mt-0.5">{projects.length} obra{projects.length!==1?"s":""}</p></div>
      <div className="grid gap-3">
        {projects.length===0 && <div className="card text-center py-12 text-brand-muted text-sm">Nenhuma obra.</div>}
        {projects.map(([n,p])=>(
          <Link key={n} href={`/hr/projects/${encodeURIComponent(n)}`} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-brand-gold/40 transition-all group">
            <div className="space-y-1.5">
              <p className="font-semibold text-brand-dark text-base">{n==="Sem obra"?"Sem obra atribuída":n}</p>
              <div className="flex items-center gap-2 text-xs text-brand-soft font-medium">
                <span>{p.workers.size} trabalhador{p.workers.size!==1?"es":""}</span><span className="text-brand-light">·</span>
                <span>{p.sheets.length} folha{p.sheets.length!==1?"s":""}</span><span className="text-brand-light">·</span>
                <span>{format(new Date(p.latest+"T00:00:00"),"dd/MM/yy",{locale:pt})}</span>
              </div>
              <div className="flex flex-wrap gap-1">{(p.sheets.map((s:any)=>s.worker?.full_name).filter((v:string,i:number,a:string[])=>a.indexOf(v)===i) as string[]).slice(0,6).map((name:string)=>(<span key={name} className="text-[11px] bg-brand-gold/10 text-brand-dark font-medium px-2 py-0.5 rounded-full">{name}</span>))}</div>
            </div>
            <div className="text-right shrink-0"><span className="stat-value text-xl">{fmtM(p.mins)}</span><span className="stat-label ml-1">horas</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
