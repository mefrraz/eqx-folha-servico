import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { notFound } from "next/navigation";
import EditUserForm from "./EditUserForm";
import ValidateButton from "../../dashboard/ValidateButton";

export const dynamic = "force-dynamic";

const DAY_LABELS: Record<string, string> = { monday: "2ª", tuesday: "3ª", wednesday: "4ª", thursday: "5ª", friday: "6ª", saturday: "Sáb" };
const WT: Record<string, string> = { new_installation: "Nova Instalação", installation_continuation: "Continuação", preventive_maintenance: "Manut. preventiva", corrective_maintenance: "Manut. corretiva" };

function calcM(e: any[]) { return e.reduce((s:number,x:any)=>{if(x.start_time&&x.end_time){const[a,b]=x.start_time.split(":").map(Number);const[c,d]=x.end_time.split(":").map(Number);return s+(c*60+d)-(a*60+b)}return s},0); }
function fmtM(m:number){const h=Math.floor(m/60);const mi=m%60;return mi?`${h}h ${mi}m`:`${h}h`;}

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", params.id).single();
  if (!profile) notFound();

  const { data: sheets } = await supabase.from("work_sheets").select("*, work_entries(*)").eq("worker_id", params.id).order("week_start", { ascending: false }).limit(60);
  const totalMins = (sheets || []).reduce((s, sh) => s + calcM(sh.work_entries || []), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy">{profile.full_name}</h2>
          <p className="text-xs font-mono text-steel mt-0.5">{params.id}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right"><span className="stat-value text-lg">{fmtM(totalMins)}</span><span className="stat-label ml-1">horas</span></div>
          <div className="text-right"><span className="stat-value text-lg">{sheets?.length || 0}</span><span className="stat-label ml-1">folhas</span></div>
        </div>
      </div>

      <EditUserForm userId={params.id} fullName={profile.full_name} />

      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-steel tracking-wide uppercase">Folhas de serviço</h4>
        {!sheets || sheets.length === 0 ? (
          <div className="card text-center py-8 text-steel text-sm">Nenhuma folha.</div>
        ) : sheets.map((sheet) => {
          const mins = calcM(sheet.work_entries || []);
          return (
            <details key={sheet.id} className="card !p-4 group">
              <summary className="cursor-pointer list-none flex items-center justify-between">
                <div>
                  <span className="font-medium text-navy text-sm">
                    Sem. {format(new Date(sheet.week_start+"T00:00:00"),"dd/MM",{locale:pt})} – {format(new Date(sheet.week_end+"T00:00:00"),"dd/MM/yy",{locale:pt})}
                  </span>
                  <span className="text-xs text-steel ml-3">{sheet.client || "—"} · {sheet.work_number || "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-navy">{fmtM(mins)}</span>
                  <ValidateButton sheetId={sheet.id} currentStatus={sheet.status} />
                </div>
              </summary>
              <table className="w-full text-xs mt-3">
                <thead><tr className="text-steel border-b border-steel-300/30"><th className="text-left py-1.5">Dia</th><th className="text-left py-1.5">Trabalho</th><th className="text-left py-1.5">Tipo</th><th className="text-right py-1.5">Horas</th></tr></thead>
                <tbody>
                  {["monday","tuesday","wednesday","thursday","friday","saturday"].map((day) => {
                    const entry = (sheet.work_entries||[]).find((e:any)=>e.day===day);
                    if(!entry) return null;
                    let dm=0; if(entry.start_time&&entry.end_time){const[a,b]=entry.start_time.split(":").map(Number);const[c,d]=entry.end_time.split(":").map(Number);dm=c*60+d-(a*60+b);}
                    return (<tr key={day} className="border-b border-steel-300/10"><td className="py-1.5 font-medium">{DAY_LABELS[day]}</td><td className="py-1.5 text-steel">{entry.work_description||"—"}</td><td className="py-1.5 text-steel/70">{WT[entry.work_type]||"—"}</td><td className="py-1.5 text-right font-mono">{dm>0?fmtM(dm):"—"}</td></tr>);
                  })}
                </tbody>
              </table>
            </details>
          );
        })}
      </div>
    </div>
  );
}
