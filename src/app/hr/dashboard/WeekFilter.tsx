"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { startOfWeek, addDays, subDays, format } from "date-fns";
import { pt } from "date-fns/locale";

export default function WeekFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date();
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const current = searchParams.get("week") || format(thisMonday, "yyyy-MM-dd");

  const weeks = [
    { value: format(thisMonday, "yyyy-MM-dd"), label: "Esta semana" },
    { value: format(subDays(thisMonday, 7), "yyyy-MM-dd"), label: "Semana passada" },
    { value: format(subDays(thisMonday, 14), "yyyy-MM-dd"), label: "Há 2 semanas" },
    { value: "", label: "Todas" },
  ];

  const handleChange = (value: string) => {
    if (value) {
      router.push(`/hr/dashboard?week=${value}`);
    } else {
      router.push("/hr/dashboard");
    }
  };

  return (
    <select
      value={current || ""}
      onChange={(e) => handleChange(e.target.value)}
      className="input-field !py-2 !px-3 text-sm w-auto"
    >
      {weeks.map((w) => (
        <option key={w.value} value={w.value}>
          {w.label}
          {w.value && ` (${format(new Date(w.value + "T00:00:00"), "dd/MM", { locale: pt })})`}
        </option>
      ))}
    </select>
  );
}
