import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import MarkReadButton from "./MarkReadButton";
import ClearAllButton from "./ClearAllButton";
import EmailTrigger from "./EmailTrigger";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const unreadNotifications = (notifications || []).filter((n) => !n.read);
  const unread = unreadNotifications.length;

  return (
    <div className="max-w-2xl space-y-4">
      <EmailTrigger />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-dark">Notificações</h2>
          <p className="text-sm text-brand-soft mt-0.5">{unread} por ler</p>
        </div>
        {unreadNotifications.length > 0 && <ClearAllButton />}
      </div>

      <div className="space-y-2">
        {unreadNotifications.length === 0 && (
          <div className="card text-center py-12 text-brand-muted text-sm">Nenhuma notificação por ler.</div>
        )}
        {unreadNotifications.map((n: any) => (
          <div key={n.id} className={`card !p-4 flex items-center justify-between ${!n.read ? "border-l-[3px] border-brand-gold" : ""}`}>
            <div className="flex-1">
              <p className={`text-sm ${!n.read ? "text-brand-dark font-semibold" : "text-brand-soft"}`}>{n.message}</p>
              <p className="text-xs text-brand-muted mt-0.5">
                {format(new Date(n.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              {n.worker_id && (
                <Link href={`/hr/users/${n.worker_id}`} className="text-xs text-brand-gold font-medium hover:underline">
                  Ver trabalhador
                </Link>
              )}
              {!n.read && <MarkReadButton id={n.id} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
