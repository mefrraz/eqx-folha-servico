import { createClient } from "@/lib/supabase/server";
import { createClient as createService } from "@supabase/supabase-js";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const supAdmin = createService(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: authUser } = await supAdmin.auth.admin.getUserById(user.id);
  const email = authUser?.user?.email || "";

  return (
    <div className="max-w-md space-y-6">
      <h2 className="text-lg font-bold text-brand-dark">Definições</h2>
      <div className="card space-y-1">
        <p className="text-sm text-brand-soft">Conta</p>
        <p className="text-xs font-mono text-brand-muted">{email}</p>
        <p className="text-xs text-brand-muted">ID: {user.id}</p>
      </div>
      <SettingsForm userId={user.id} fullName={profile?.full_name || ""} userEmail={email} />
    </div>
  );
}
