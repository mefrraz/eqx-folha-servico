import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import MarkReadButton from "./MarkReadButton";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const unread = (notifications || []).filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-dark">Notificações</h2>
          <p className="text-sm text-brand-soft mt-0.5">{unread} por ler</p>
        </div>
      </div>

      <div className="space-y-2">
        {(!notifications || notifications.length === 0) && (
          <div className="card text-center py-12 text-brand-muted text-sm">Nenhuma notificação.</div>
        )}
        {notifications?.map((n: any) => (
          <div key={n.id} className={`card !p-4 flex items-center justify-between ${!n.read ? "border-l-[3px] border-brand-gold" : ""}`}>
            <div className="flex-1">
              <p className={`text-sm ${!n.read ? "text-brand-dark font-semibold" : "text-brand-soft"}`}>{n.message}</p>
              <p className="text-xs text-brand-muted mt-0.5">
                {format(new Date(n.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              {n.sheet_id && (
                <Link href={`/hr/projects`} className="text-xs text-brand-gold font-medium hover:underline">Ver folha</Link>
              )}
              {!n.read && <MarkReadButton id={n.id} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
