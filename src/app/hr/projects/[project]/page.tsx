import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import ValidateButton from "../../dashboard/ValidateButton";

export const dynamic = "force-dynamic";
const DL:Record<string,string>={monday:"2ª",tuesday:"3ª",wednesday:"4ª",thursday:"5ª",friday:"6ª",saturday:"Sáb"};
const WL:Record<string,string>={new_installation:"Nova Instalação",installation_continuation:"Continuação",preventive_maintenance:"Manut. preventiva",corrective_maintenance:"Manut. corretiva"};
function cM(e:any[]){return e.reduce((s:number,x:any)=>{if(x.start_time&&x.end_time){const[a,b]=x.start_time.split(":").map(Number);const[c,d]=x.end_time.split(":").map(Number);return s+(c*60+d)-(a*60+b)}return s},0);}
function fM(m:number){const h=Math.floor(m/60);const mi=m%60;return mi?`${h}h ${mi}m`:`${h}h`;}
function wL(d:string){return format(new Date(d+"T00:00:00"),"dd/MM",{locale:pt});}

export default async function ProjectDetail({ params }: { params: { project: string } }) {
  const supabase = await createClient();
  const pn = decodeURIComponent(params.project);
  const { data: sheets } = await supabase.from("work_sheets").select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)").eq("work_number",pn).order("week_start",{ascending:false}).limit(200);

  if(!sheets?.length) return (<div className="card text-center py-16"><p className="text-brand-muted text-sm">Obra não encontrada.</p><Link href="/hr/projects" className="btn-ghost mt-3 inline-flex">← Obras</Link></div>);

  const safe=sheets!;
  const tM=safe.reduce((s,sh)=>s+cM(sh.work_entries||[]),0);
  const wS=new Set(safe.map(s=>s.worker_id));
  const wC=new Set(safe.map(s=>s.week_start)).size;
  const avg=wC>0?tM/60/wC:0;
  const wM=new Map<string,number>(); for(const s of safe){const m=cM(s.work_entries||[]);wM.set(s.week_start,(wM.get(s.week_start)||0)+m);}
  const sW=Array.from(wM.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  const max=Math.max(...Array.from(wM.values()),1);

  return (
    <div className="space-y-6">
      <Link href="/hr/projects" className="text-xs text-brand-muted hover:text-brand-dark transition-colors">← Obras</Link>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div><h2 className="text-xl font-bold text-brand-dark">{pn==="Sem obra"?"Sem obra atribuída":pn}</h2><p className="text-sm text-brand-soft mt-1">{wS.size} trabalhador{wS.size!==1?"es":""} · {safe.length} folha{safe.length!==1?"s":""} · {wC} semana{wC!==1?"s":""}</p></div>
        <div className="flex gap-4 text-right"><div><span className="stat-value text-lg">{fM(tM)}</span><span className="stat-label ml-1">total</span></div><div><span className="stat-value text-lg">{Math.round(avg)}h</span><span className="stat-label ml-1">média/sem</span></div></div>
      </div>
      <div className="card space-y-3"><h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Horas por semana</h4>{sW.slice(-8).map(([w,m])=>(<div key={w} className="flex items-center gap-3"><span className="text-xs font-mono text-brand-soft w-14 text-right">{wL(w)}</span><div className="flex-1 h-5 bg-brand-light/20 rounded-full overflow-hidden"><div className="h-full bg-brand-gold/70 rounded-full" style={{width:`${(m/max)*100}%`}}/></div><span className="text-xs font-mono text-brand-dark w-16">{fM(m)}</span></div>))}</div>
      <div className="space-y-3"><h4 className="text-xs font-semibold text-brand-soft tracking-wide uppercase">Folhas</h4>{safe.map(s=>{const em=cM(s.work_entries||[]);return(<details key={s.id} className="card !p-4 group"><summary className="cursor-pointer list-none flex items-center justify-between"><div><span className="font-medium text-brand-dark text-sm">{s.worker?.full_name||"—"}</span><span className="text-xs text-brand-soft ml-3">Sem. {wL(s.week_start)}–{wL(s.week_end)}</span></div><div className="flex items-center gap-3"><span className="text-xs font-mono text-brand-dark">{fM(em)}</span><ValidateButton sheetId={s.id} currentStatus={s.status}/></div></summary><table className="w-full text-xs mt-3"><thead><tr className="text-brand-soft border-b border-brand-light/30"><th className="text-left py-1.5 font-medium">Dia</th><th className="text-left py-1.5 font-medium">Trabalho</th><th className="text-left py-1.5 font-medium">Tipo</th><th className="text-right py-1.5 font-medium">Horas</th></tr></thead><tbody>{["monday","tuesday","wednesday","thursday","friday","saturday"].map(day=>{const e=(s.work_entries||[]).find((x:any)=>x.day===day);if(!e)return null;let dm=0;if(e.start_time&&e.end_time){const[a,b]=e.start_time.split(":").map(Number);const[c,d]=e.end_time.split(":").map(Number);dm=c*60+d-(a*60+b);}return(<tr key={day} className="border-b border-brand-light/20"><td className="py-1.5 font-medium text-brand-dark">{DL[day]}</td><td className="py-1.5 text-brand-soft">{e.work_description||"—"}</td><td className="py-1.5 text-brand-muted">{WL[e.work_type]||"—"}</td><td className="py-1.5 text-right font-mono text-brand-dark">{dm>0?fM(dm):"—"}</td></tr>);})}</tbody></table></details>);})}</div>
    </div>
  );
}
