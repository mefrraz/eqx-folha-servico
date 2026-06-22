import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import UserProfileClient from "./UserProfileClient";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", params.id).single();
  if (!profile) notFound();

  // Email vem da coluna email em profiles (sincronizada via trigger)
  const email = profile.email || "";

  const { data: sheets } = await supabase.from("work_sheets").select("*, work_entries(*)").eq("worker_id", params.id).order("week_start", { ascending: false }).limit(52);

  return <UserProfileClient userId={params.id} profile={profile} sheets={sheets || []} userEmail={email} />;
}
