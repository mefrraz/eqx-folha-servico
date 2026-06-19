import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AddClientButton from "./AddClientButton";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase.from("clients").select("*, projects(count)").order("name");
  const { data: allProjects } = await supabase.from("projects").select("id, client_id");
  const { data: sheets } = await supabase.from("work_sheets").select("project_id, worker_id").limit(1000);

  // Count workers per client
  const workerCount = new Map<string, Set<string>>();
  for (const s of sheets || []) {
    const project = (allProjects || []).find((p) => p.id === s.project_id);
    if (project?.client_id) {
      if (!workerCount.has(project.client_id)) workerCount.set(project.client_id, new Set());
      workerCount.get(project.client_id)!.add(s.worker_id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-dark">Clientes</h2>
          <p className="text-sm text-brand-soft mt-0.5">{clients?.length || 0} cliente{(clients?.length || 0) !== 1 ? "s" : ""}</p>
        </div>
        <AddClientButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(!clients || clients.length === 0) && (
          <div className="col-span-full card text-center py-12 text-brand-muted text-sm">Nenhum cliente registado.</div>
        )}
        {clients?.map((c: any) => {
          const wc = workerCount.get(c.id)?.size || 0;
          const pc = c.projects?.[0]?.count || 0;
          return (
            <Link key={c.id} href={`/hr/clients/${c.id}`} className="card hover:border-brand-gold/40 transition-all group flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.name} className="w-10 h-10 rounded-xl object-cover border border-brand-light/30" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-dark font-bold text-sm">
                    {c.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-brand-dark text-base">{c.name}</p>
                  <p className="text-xs text-brand-soft">{pc} obra{pc !== 1 ? "s" : ""} · {wc} trabalhador{wc !== 1 ? "es" : ""}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
