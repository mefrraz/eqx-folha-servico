import { createClient } from "@/lib/supabase/server";
import RequestsClient from "./RequestsClient";

export const dynamic = "force-dynamic";

export default async function ProjectRequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("worker_projects")
    .select("worker_id, project_id, created_at, worker:profiles!worker_projects_worker_id_fkey(full_name, email), project:projects!worker_projects_project_id_fkey(name, number)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Pedidos de obras</h1>
        <p className="text-sm text-brand-soft mt-1">Aprove ou rejeite os pedidos de obras dos trabalhadores.</p>
      </div>
      <RequestsClient requests={(requests || []) as any[]} />
    </div>
  );
}
