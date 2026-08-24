import { createClient } from "@/lib/supabase/server";
import InviteManager from "./InviteManager";

export const dynamic = "force-dynamic";

export default async function InvitesPage() {
  const supabase = await createClient();
  const { data: invites } = await supabase
    .from("invites")
    .select("*, used:profiles!invites_used_by_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Convites de acesso</h1>
        <p className="text-sm text-brand-soft mt-1">
          Crie códigos de convite para os trabalhadores se registarem. Os códigos expirados ficam guardados para estatística.
        </p>
      </div>
      <InviteManager invites={(invites || []) as any[]} />
    </div>
  );
}
