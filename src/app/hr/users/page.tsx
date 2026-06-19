import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

function calcM(entries: any[]): number {
  return entries.reduce((s: number, e: any) => {
    if (e.start_time && e.end_time) {
      const [sh, sm] = e.start_time.split(":").map(Number);
      const [eh, em] = e.end_time.split(":").map(Number);
      return s + (eh * 60 + em) - (sh * 60 + sm);
    }
    return s;
  }, 0);
}
function fmtM(m: number) { const h = Math.floor(m/60); const mi = m % 60; return mi ? `${h}h ${mi}m` : `${h}h`; }

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: workers } = await supabase.from("profiles").select("id, full_name, role, created_at").eq("role", "worker").order("full_name");

  const { data: sheets } = await supabase.from("work_sheets").select("worker_id, week_start, work_entries(*)").order("week_start", { ascending: false }).limit(500);

  const latestByWorker = new Map<string, any>();
  for (const s of sheets || []) { if (!latestByWorker.has(s.worker_id)) latestByWorker.set(s.worker_id, s); }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-navy">Utilizadores</h2>
        <p className="text-sm text-steel mt-0.5">{workers?.length || 0} trabalhadores</p>
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-steel-300/30 bg-navy/[0.01]">
              <th className="text-left py-3 px-4 font-semibold text-navy text-xs tracking-wide">Nome</th>
              <th className="text-left py-3 px-4 font-semibold text-navy text-xs tracking-wide hidden sm:table-cell">Última folha</th>
              <th className="text-left py-3 px-4 font-semibold text-navy text-xs tracking-wide hidden md:table-cell">Horas</th>
              <th className="text-left py-3 px-4 font-semibold text-navy text-xs tracking-wide hidden lg:table-cell">Registo</th>
            </tr>
          </thead>
          <tbody>
            {(workers || []).map((w) => {
              const latest = latestByWorker.get(w.id);
              const mins = calcM(latest?.work_entries || []);
              return (
                <tr key={w.id} className="border-b border-steel-300/10 hover:bg-navy/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/hr/users/${w.id}`} className="text-navy hover:text-navy font-medium">
                      {w.full_name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-steel hidden sm:table-cell font-mono text-xs">
                    {latest ? format(new Date(latest.week_start + "T00:00:00"), "dd/MM/yy", { locale: pt }) : "—"}
                  </td>
                  <td className="py-3 px-4 text-navy hidden md:table-cell font-mono text-xs">{latest ? fmtM(mins) : "—"}</td>
                  <td className="py-3 px-4 text-steel/60 hidden lg:table-cell text-xs font-mono">
                    {format(new Date(w.created_at), "dd/MM/yy", { locale: pt })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!workers || workers.length === 0) && (
          <div className="text-center py-12 text-steel text-sm">Nenhum utilizador.</div>
        )}
      </div>
    </div>
  );
}
