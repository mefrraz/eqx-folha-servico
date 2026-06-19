import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SheetForm from "@/components/SheetForm";

export const dynamic = "force-dynamic";

export default async function EditSheetPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sheet } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*)")
    .eq("id", params.id)
    .eq("worker_id", user!.id)
    .single();

  if (!sheet) {
    notFound();
  }

  return <SheetForm existingSheet={sheet} />;
}
