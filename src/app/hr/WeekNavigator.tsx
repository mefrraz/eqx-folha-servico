"use client";

import { useRouter } from "next/navigation";
import { format, addDays, subDays } from "date-fns";
import { pt } from "date-fns/locale";

export default function WeekNavigator({ currentWeek }: { currentWeek: string }) {
  const router = useRouter();
  const monday = new Date(currentWeek + "T00:00:00");
  const prevMonday = format(subDays(monday, 7), "yyyy-MM-dd");
  const nextMonday = format(addDays(monday, 7), "yyyy-MM-dd");
  const saturday = addDays(monday, 5);

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => router.push(`/hr?w=${prevMonday}`)}
        className="btn-ghost text-xs"
      >
        ← Anterior
      </button>
      <h2 className="text-base font-semibold text-navy font-mono tracking-tight">
        {format(monday, "dd", { locale: pt })} – {format(saturday, "dd 'de' MMM", { locale: pt })}
      </h2>
      <button
        onClick={() => router.push(`/hr?w=${nextMonday}`)}
        className="btn-ghost text-xs"
      >
        Seguinte →
      </button>
    </div>
  );
}
