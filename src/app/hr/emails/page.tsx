import { createClient } from "@/lib/supabase/server";
import EmailClient from "./EmailClient";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const supabase = await createClient();
  const { data: workers } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "worker")
    .order("full_name");

  return <EmailClient workers={workers || []} />;
}
