import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import AddProjectGlobal from "./AddProjectGlobal";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase.from("projects").select("*, client:clients(name)").order("name");
  const { data: sheets } = await supabase.from("work_sheets").select("project_id, worker_id, worker:profiles!work_sheets_worker_id_fkey(full_name), week_start").order("week_start", { ascending: false }).limit(1000);
  const { data: clients } = await supabase.from("clients").select("id, name").order("name");
  const { data: assignments } = await supabase.from("worker_projects").select("worker_id, project_id");

  // Aggregate per project — from sheets + assignments
  const projectData = new Map<string, { workers: Set<string>; workerNames: string[]; sheetCount: number; latestWeek: string }>();
  for (const s of sheets || []) {
    const pid = s.project_id;
    if (!pid) continue;
    if (!projectData.has(pid)) projectData.set(pid, { workers: new Set(), workerNames: [], sheetCount: 0, latestWeek: s.week_start });
    const d = projectData.get(pid)!;
    d.workers.add(s.worker_id);
    // worker name from profiles join
    const w = s.worker as any;
    const name = w?.full_name || "";
    if (name && !d.workerNames.includes(name)) d.workerNames.push(name);
    d.sheetCount++;
    if (s.week_start > d.latestWeek) d.latestWeek = s.week_start;
  }
  // Also count workers from assignments (even if they haven't submitted sheets yet)
  for (const a of assignments || []) {
    if (!projectData.has(a.project_id)) projectData.set(a.project_id, { workers: new Set(), workerNames: [], sheetCount: 0, latestWeek: "" });
    projectData.get(a.project_id)!.workers.add(a.worker_id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-dark">Obras</h2>
          <p className="text-sm text-brand-soft mt-0.5">{projects?.length || 0} obra{(projects?.length || 0) !== 1 ? "s" : ""}</p>
        </div>
        <AddProjectGlobal clients={clients || []} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(!projects || projects.length === 0) && (
          <div className="col-span-full card text-center py-12 text-brand-muted text-sm">Nenhuma obra registada.</div>
        )}
        {projects?.map((p: any) => {
          const d = projectData.get(p.id);
          const wc = d?.workers.size || 0;
          const sc = d?.sheetCount || 0;
          return (
            <Link key={p.id} href={`/hr/projects/${p.id}`} className="card hover:border-brand-gold/40 transition-all group flex flex-col gap-3">
              <div>
                <p className="font-semibold text-brand-dark">{p.name}</p>
                {p.number && <p className="text-xs text-brand-gold font-mono mt-0.5">{p.number}</p>}
                {p.client?.name && <p className="text-xs text-brand-soft mt-0.5">{p.client.name}</p>}
                {p.location && <p className="text-xs text-brand-muted mt-0.5">{p.location}</p>}
              </div>
              <div className="flex items-center gap-3 text-xs text-brand-soft font-medium">
                <span>{wc} trabalhador{wc !== 1 ? "es" : ""}</span>
                <span className="text-brand-light">·</span>
                <span>{sc} folha{sc !== 1 ? "s" : ""}</span>
                {d?.latestWeek && <><span className="text-brand-light">·</span><span className="text-brand-muted">{format(new Date(d.latestWeek+"T00:00:00"),"dd/MM/yy",{locale:pt})}</span></>}
              </div>
              {d?.workerNames && d.workerNames.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {d.workerNames.slice(0, 5).map((name: string) => (
                    <span key={name} className="text-[11px] bg-brand-gold/10 text-brand-dark font-medium px-2 py-0.5 rounded-full">{name}</span>
                  ))}
                  {d.workerNames.length > 5 && <span className="text-[11px] text-brand-muted px-1">+{d.workerNames.length - 5}</span>}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
