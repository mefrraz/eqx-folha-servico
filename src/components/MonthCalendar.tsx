"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { pt } from "date-fns/locale";

interface SheetWeek {
  weekStart: Date;
  weekEnd: Date;
  hasSheet: boolean;
  sheetId?: string;
  status?: string;
}

export default function MonthCalendar({ sheets, selectedWeek, onSelectWeek }: { sheets: SheetWeek[]; selectedWeek: Date | null; onSelectWeek: (d: Date) => void }) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const DAYS = ["D","S","T","Q","Q","S","S"];

  const sheetWeekStarts = new Set(sheets.map(s => format(s.weekStart, "yyyy-MM-dd")));

  const getDayStatus = (day: Date): "selected" | "hasSheet" | "today" | "normal" => {
    const ds = format(day, "yyyy-MM-dd");
    if (selectedWeek && ds >= format(startOfWeek(selectedWeek,{weekStartsOn:1}),"yyyy-MM-dd") && ds <= format(endOfWeek(selectedWeek,{weekStartsOn:1}),"yyyy-MM-dd")) return "selected";
    if (sheetWeekStarts.has(format(startOfWeek(day,{weekStartsOn:1}),"yyyy-MM-dd"))) return "hasSheet";
    if (isSameDay(day, today)) return "today";
    return "normal";
  };

  const handleDayClick = (day: Date) => {
    onSelectWeek(startOfWeek(day, { weekStartsOn: 1 }));
  };

  const handlePrev = () => setViewDate(subMonths(viewDate, 1));
  const handleNext = () => setViewDate(addMonths(viewDate, 1));

  return (
    <div className="select-none max-w-[260px] mx-auto">
      {/* Month header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={handlePrev} className="text-brand-muted hover:text-brand-dark text-xs px-1">&lt;</button>
        <span className="text-sm font-semibold text-brand-dark">{format(viewDate, "MMM yyyy", { locale: pt })}</span>
        <button onClick={handleNext} className="text-brand-muted hover:text-brand-dark text-xs px-1">&gt;</button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d,i) => (
          <div key={i} className="text-center text-[10px] font-medium text-brand-muted py-0.5">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} className="aspect-square" />)}
        {days.map(day => {
          const status = getDayStatus(day);
          const weekInfo = sheets.find(s => isSameDay(startOfWeek(day,{weekStartsOn:1}), s.weekStart));
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              title={weekInfo ? `Folha ${weekInfo.status === "submitted" ? "Submetida" : weekInfo.status === "draft" ? "Rascunho" : "Validada"}` : ""}
              className={`aspect-square flex items-center justify-center rounded-md text-xs font-medium transition-all
                ${status === "selected" ? "bg-brand-gold text-brand-dark font-bold" : ""}
                ${status === "hasSheet" ? "bg-brand-gold/15 text-brand-dark" : ""}
                ${status === "today" ? "ring-2 ring-brand-gold/50" : ""}
                ${status === "normal" ? "hover:bg-brand-light/15 text-brand-soft" : ""}
              `}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-brand-muted justify-center">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-brand-gold/15" />Folha</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-brand-gold" />Selecionada</span>
      </div>
    </div>
  );
}
