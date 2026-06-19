"use client";
import { useRouter } from "next/navigation";
import { format, addDays, subDays } from "date-fns";
import { pt } from "date-fns/locale";

export default function WeekNavigator({ currentWeek }: { currentWeek: string }) {
  const router = useRouter();
  const monday = new Date(currentWeek + "T00:00:00");
  return (
    <div className="flex items-center justify-between">
      <button onClick={() => router.push(`/hr?w=${format(subDays(monday,7),"yyyy-MM-dd")}`)} className="btn-ghost text-xs">← Anterior</button>
      <h2 className="text-base font-semibold text-brand-dark font-mono tracking-tight">{format(monday,"dd",{locale:pt})} – {format(addDays(monday,5),"dd 'de' MMM",{locale:pt})}</h2>
      <button onClick={() => router.push(`/hr?w=${format(addDays(monday,7),"yyyy-MM-dd")}`)} className="btn-ghost text-xs">Seguinte →</button>
    </div>
  );
}
