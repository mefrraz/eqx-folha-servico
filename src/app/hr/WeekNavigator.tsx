"use client";

import { useRouter } from "next/navigation";
import { format, addDays, subDays } from "date-fns";
import { pt } from "date-fns/locale";

interface WeekNavigatorProps {
  currentWeek: string; // yyyy-MM-dd (Monday)
}

export default function WeekNavigator({ currentWeek }: WeekNavigatorProps) {
  const router = useRouter();
  const monday = new Date(currentWeek + "T00:00:00");
  const prevMonday = format(subDays(monday, 7), "yyyy-MM-dd");
  const nextMonday = format(addDays(monday, 7), "yyyy-MM-dd");
  const saturday = addDays(monday, 5);

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => router.push(`/hr?w=${prevMonday}`)}
        className="btn-secondary !py-1.5 !px-3 text-sm"
      >
        ← Anterior
      </button>
      <h2 className="text-lg font-bold text-gray-900 text-center">
        {format(monday, "dd/MM", { locale: pt })} — {format(saturday, "dd/MM/yyyy", { locale: pt })}
      </h2>
      <button
        onClick={() => router.push(`/hr?w=${nextMonday}`)}
        className="btn-secondary !py-1.5 !px-3 text-sm"
      >
        Seguinte →
      </button>
    </div>
  );
}
