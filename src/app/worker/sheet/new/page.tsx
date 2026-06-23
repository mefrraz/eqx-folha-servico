import { createClient } from "@/lib/supabase/server";
import { startOfWeek, format } from "date-fns";
import SheetForm from "@/components/SheetForm";

export const dynamic = "force-dynamic";

export default async function NewSheetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <SheetForm />;

  // Check if sheet already exists for current week
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const { data: existing } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*)")
    .eq("worker_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  return <SheetForm existingSheet={existing} />;
}
