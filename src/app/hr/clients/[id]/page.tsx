import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditClient from "./EditClient";
import AddProjectButton from "./AddProjectButton";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", params.id).single();
  if (!client) notFound();

  const { data: projects } = await supabase.from("projects").select("id, name, location").eq("client_id", params.id).order("name");
  const { data: sheets } = await supabase.from("work_sheets").select("project_id, worker_id").limit(1000);

  const workerCount = new Map<string, Set<string>>();
  const sheetCount = new Map<string, number>();
  for (const s of sheets || []) {
    if (!workerCount.has(s.project_id)) workerCount.set(s.project_id, new Set());
    workerCount.get(s.project_id)!.add(s.worker_id);
    sheetCount.set(s.project_id, (sheetCount.get(s.project_id) || 0) + 1);
  }

  return (
    <div className="space-y-6">
      <Link href="/hr/clients" className="text-xs text-brand-muted hover:text-brand-dark transition-colors">← Clientes</Link>

      <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {client.logo_url ? (
            <img src={client.logo_url} alt={client.name} className="w-16 h-16 rounded-xl object-cover border border-brand-light/30" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-dark font-bold text-2xl">{client.name.charAt(0)}</div>
          )}
          <div>
            <h2 className="text-xl font-bold text-brand-dark">{client.name}</h2>
            <p className="text-sm text-brand-soft">{(projects || []).length} obra{(projects||[]).length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <EditClient client={client} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-soft tracking-wide uppercase">Obras</h3>
        <AddProjectButton clientId={client.id} />
      </div>

      <div className="grid gap-3">
        {(!projects || projects.length === 0) && (
          <div className="card text-center py-8 text-brand-muted text-sm">Nenhuma obra associada.</div>
        )}
        {projects?.map((p: any) => {
          const wc = workerCount.get(p.id)?.size || 0;
          const sc = sheetCount.get(p.id) || 0;
          return (
            <Link key={p.id} href={`/hr/projects/${p.id}`} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-brand-gold/40 transition-all">
              <div>
                <p className="font-semibold text-brand-dark">{p.name}</p>
                <div className="flex items-center gap-2 text-xs text-brand-soft mt-0.5">
                  <span>{wc} trabalhador{wc !== 1 ? "es" : ""}</span>
                  <span className="text-brand-light">·</span>
                  <span>{sc} folha{sc !== 1 ? "s" : ""}</span>
                  {p.location && <><span className="text-brand-light">·</span><span>{p.location}</span></>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
