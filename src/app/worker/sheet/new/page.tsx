import { createClient } from "@/lib/supabase/server";
import { startOfWeek, format } from "date-fns";
import SheetForm from "@/components/SheetForm";
import ObraChooser from "./ObraChooser";

export const dynamic = "force-dynamic";

export default async function NewSheetPage({ searchParams }: { searchParams: { obra?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <ObraChooser obras={[]} />;

  // Obras aprovadas do trabalhador (só as dele — nunca todas)
  const { data: assignments } = await supabase
    .from("worker_projects")
    .select("project:projects(id, name, number, client:clients(name))")
    .eq("worker_id", user.id)
    .eq("status", "approved");
  const obras = (assignments || []).map((a: any) => a.project).filter(Boolean);

  // Sem ?obra= → escolher obra
  if (!searchParams?.obra) {
    return <ObraChooser obras={obras as any[]} />;
  }

  const project = obras.find((o: any) => o.id === searchParams.obra);
  if (!project) return <ObraChooser obras={obras as any[]} />;

  // Folha existente desta semana para esta obra
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const { data: existing } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*)")
    .eq("worker_id", user.id)
    .eq("week_start", weekStart)
    .eq("project_id", searchParams.obra)
    .maybeSingle();

  return <SheetForm project={project as any} existingSheet={existing} />;
}