import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import UserProfileClient from "./UserProfileClient";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", params.id).single();
  if (!profile) notFound();

  // Fetch user email (via service_role)
  const supAdmin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: authUser } = await supAdmin.auth.admin.getUserById(params.id);
  const email = authUser?.user?.email || "";

  const { data: sheets } = await supabase.from("work_sheets").select("*, work_entries(*)").eq("worker_id", params.id).order("week_start", { ascending: false }).limit(52);

  return <UserProfileClient userId={params.id} profile={profile} sheets={sheets || []} userEmail={email} />;
}
