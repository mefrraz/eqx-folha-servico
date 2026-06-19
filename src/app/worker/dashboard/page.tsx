import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

function calcM(e: any[]) { return e.reduce((s:number,x:any)=>{if(x.start_time&&x.end_time){const[a,b]=x.start_time.split(":").map(Number);const[c,d]=x.end_time.split(":").map(Number);return s+(c*60+d)-(a*60+b)}return s},0); }
function fmtM(m:number){const h=Math.floor(m/60);const mi=m%60;return mi?`${h}h ${mi}m`:`${h}h`;}

const STATUS: Record<string,string> = { draft: "Rascunho", submitted: "Submetida", reviewed: "Validada" };

export default async function WorkerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: sheets } = await supabase.from("work_sheets").select("*, work_entries(*)").eq("worker_id", user!.id).order("week_start", { ascending: false }).limit(30);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const ws = format(weekStart, "yyyy-MM-dd");
  const current = sheets?.find((s) => s.week_start === ws);

  return (
    <div className="space-y-6">
      <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-navy">
            Semana de {format(weekStart, "dd/MM", { locale: pt })} a {format(addDays(weekStart, 5), "dd/MM/yyyy", { locale: pt })}
          </h2>
          <p className="text-sm text-steel mt-0.5">
            {current ? `Folha ${STATUS[current.status] || current.status}` : "Ainda não submeteu a folha desta semana."}
          </p>
        </div>
        {current ? (
          <Link href={`/worker/sheet/${current.id}`} className="btn-primary text-sm">Editar folha</Link>
        ) : (
          <Link href="/worker/sheet/new" className="btn-primary text-sm">Nova folha de serviço</Link>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-steel tracking-wide uppercase mb-3">Folhas anteriores</h3>
        {!sheets || sheets.length === 0 ? (
          <div className="card text-center py-10 text-steel text-sm">Nenhuma folha.</div>
        ) : (
          <div className="grid gap-2">
            {sheets.map((sheet) => {
              const mins = calcM(sheet.work_entries || []);
              return (
                <Link key={sheet.id} href={`/worker/sheet/${sheet.id}`}
                  className="card !p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:border-navy/30 transition-all">
                  <div>
                    <p className="font-medium text-navy text-sm">
                      Semana {format(new Date(sheet.week_start+"T00:00:00"),"dd/MM",{locale:pt})} – {format(new Date(sheet.week_end+"T00:00:00"),"dd/MM/yy",{locale:pt})}
                    </p>
                    <p className="text-xs text-steel">{sheet.client || "—"} · {sheet.work_number || "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-navy">{fmtM(mins)}</span>
                    <span className={sheet.status === "draft" ? "badge-draft" : sheet.status === "submitted" ? "badge-submitted" : "badge-reviewed"}>
                      {STATUS[sheet.status] || sheet.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
