"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { pt } from "date-fns/locale";

interface SheetWeek { weekStart: Date; weekEnd: Date; hasSheet: boolean; sheetId?: string; status?: string; }

export default function MonthCalendar({ sheets, selectedWeek, onSelectWeek }: { sheets: SheetWeek[]; selectedWeek: Date | null; onSelectWeek: (d: Date) => void }) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const DAYS = ["D","S","T","Q","Q","S","S"];
  const WSO = { weekStartsOn: 0 as const };

  const sheetWeekStarts = new Set(sheets.map(s => format(startOfWeek(s.weekStart, WSO), "yyyy-MM-dd")));

  const getDayStatus = (day: Date): "selected" | "hasSheet" | "today" | "normal" => {
    const ds = format(day, "yyyy-MM-dd");
    if (selectedWeek && ds >= format(startOfWeek(selectedWeek, WSO), "yyyy-MM-dd") && ds <= format(endOfWeek(selectedWeek, WSO), "yyyy-MM-dd")) return "selected";
    if (sheetWeekStarts.has(format(startOfWeek(day, WSO), "yyyy-MM-dd"))) return "hasSheet";
    if (isSameDay(day, today)) return "today";
    return "normal";
  };

  const handleDayClick = (day: Date) => {
    onSelectWeek(startOfWeek(day, WSO));
  };

  return (
    <div className="select-none w-full">
      <div className="flex items-center justify-between mb-1.5">
        <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="text-brand-muted hover:text-brand-dark text-xs px-0.5">&lt;</button>
        <span className="text-xs font-semibold text-brand-dark">{format(viewDate, "MMM yyyy", { locale: pt })}</span>
        <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="text-brand-muted hover:text-brand-dark text-xs px-0.5">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-0.5">
        {DAYS.map((d,i) => <div key={i} className="text-center text-[10px] font-medium text-brand-muted py-0.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} className="aspect-square" />)}
        {days.map(day => {
          const status = getDayStatus(day);
          const weekSheet = sheets.find(s => isSameDay(startOfWeek(day, WSO), startOfWeek(s.weekStart, WSO)));
          return (
            <button key={day.toISOString()} onClick={() => handleDayClick(day)}
              title={weekSheet ? `Folha ${weekSheet.status==="submitted"?"Submetida":weekSheet.status==="draft"?"Rascunho":"Validada"}` : ""}
              className={`aspect-square flex items-center justify-center rounded-md text-xs font-medium transition-all
                ${status === "selected" ? "bg-brand-gold text-brand-dark font-bold" : ""}
                ${status === "hasSheet" ? "bg-brand-gold/10 text-brand-dark" : ""}
                ${status === "today" ? "ring-1.5 ring-brand-gold/60" : ""}
                ${status === "normal" ? "hover:bg-brand-light/10 text-brand-soft" : ""}`}
            >{format(day, "d")}</button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-brand-muted justify-center">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-brand-gold/10" />Folha</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-brand-gold" />Selecionada</span>
      </div>
    </div>
  );
}
