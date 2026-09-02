import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { calcMinutes, formatMinutes } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WorkerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: sheets } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*), project:projects(name)")
    .eq("worker_id", user!.id)
    .order("week_start", { ascending: false })
    .limit(60);
  const ws = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const current = (sheets || []).filter((s: any) => s.week_start === ws);

  return (
    <div className="space-y-6">
      <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-dark">Semana de {format(startOfWeek(new Date(), { weekStartsOn: 1 }), "dd/MM", { locale: pt })} a {format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 5), "dd/MM/yyyy", { locale: pt })}</h2>
          <p className="text-sm text-brand-soft mt-0.5">
            {current.length === 0
              ? "Ainda não submeteu folhas desta semana."
              : `${current.length} folha(s) desta semana — uma por obra.`}
          </p>
        </div>
        <Link href="/worker/sheet/new" className="btn-primary text-sm">+ Nova folha</Link>
      </div>

      {current.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-brand-soft tracking-wide uppercase mb-3">Folhas desta semana</h3>
          <div className="grid gap-2">
            {current.map((s: any) => (
              <Link key={s.id} href={`/worker/sheet/${s.id}`} className="card !p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:border-brand-gold/40 transition-all">
                <div>
                  <p className="font-medium text-brand-dark text-sm">{s.project?.name || "—"}</p>
                  <p className="text-xs text-brand-soft">{s.client || "—"} · {s.work_number || "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-brand-dark">{formatMinutes(calcMinutes(s.work_entries || []))}</span>
                  <span className={s.status === "draft" ? "badge-draft" : s.status === "submitted" ? "badge-submitted" : "badge-reviewed"}>{STATUS_LABELS[s.status] || s.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-brand-soft tracking-wide uppercase mb-3">Folhas anteriores</h3>
        {(!sheets || sheets.length === 0) ? (
          <div className="card text-center py-10 text-brand-muted text-sm">Nenhuma folha.</div>
        ) : (
          <div className="grid gap-2">
            {(sheets || []).filter((s: any) => s.week_start !== ws).map((s: any) => (
              <Link key={s.id} href={`/worker/sheet/${s.id}`} className="card !p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:border-brand-gold/40 transition-all">
                <div>
                  <p className="font-medium text-brand-dark text-sm">{s.project?.name || "—"} · {format(new Date(s.week_start + "T00:00:00"), "dd/MM", { locale: pt })}–{format(new Date(s.week_end + "T00:00:00"), "dd/MM/yy", { locale: pt })}</p>
                  <p className="text-xs text-brand-soft">{s.client || "—"} · {s.work_number || "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-brand-dark">{formatMinutes(calcMinutes(s.work_entries || []))}</span>
                  <span className={s.status === "draft" ? "badge-draft" : s.status === "submitted" ? "badge-submitted" : "badge-reviewed"}>{STATUS_LABELS[s.status] || s.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}