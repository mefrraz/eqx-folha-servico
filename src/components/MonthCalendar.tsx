"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { pt } from "date-fns/locale";

interface SheetWeek {
  weekStart: Date;
  weekEnd: Date;
  hasSheet: boolean;
  sheetId?: string;
  hours?: string;
  status?: string;
}

interface MonthCalendarProps {
  sheets: SheetWeek[];
  selectedWeek: Date | null;
  onSelectWeek: (monday: Date) => void;
}

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export default function MonthCalendar({ sheets, selectedWeek, onSelectWeek }: MonthCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const today = new Date();

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const isInSelectedWeek = (day: Date) => {
    if (!selectedWeek) return false;
    const ws = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const we = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    return day >= ws && day <= we;
  };

  const hasSheetOnDay = (day: Date) => {
    return sheets.some(s => {
      const ws = startOfWeek(s.weekStart, { weekStartsOn: 1 });
      return isSameDay(day, ws);
    });
  };

  const handlePrev = () => setViewDate(subMonths(viewDate, 1));
  const handleNext = () => setViewDate(addMonths(viewDate, 1));
  const handleDayClick = (day: Date) => {
    const monday = startOfWeek(day, { weekStartsOn: 1 });
    onSelectWeek(monday);
  };

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={handlePrev} className="btn-ghost !p-1 text-xs">&lt;</button>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }}
            className="text-sm font-semibold text-brand-dark hover:text-brand-gold transition-colors">
            {format(viewDate, "MMM", { locale: pt })}
          </button>
          <button onClick={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }}
            className="text-sm font-semibold text-brand-dark hover:text-brand-gold transition-colors">
            {format(viewDate, "yyyy")}
          </button>
        </div>
        <button onClick={handleNext} className="btn-ghost !p-1 text-xs">&gt;</button>
      </div>

      {/* Month picker */}
      {showMonthPicker && (
        <div className="absolute z-20 bg-white border border-brand-light/30 rounded-2xl shadow-xl p-3 grid grid-cols-4 gap-1 mb-2">
          {MONTHS.map((m, i) => (
            <button key={m} onClick={() => { setViewDate(new Date(viewDate.getFullYear(), i, 1)); setShowMonthPicker(false); }}
              className={`text-xs px-2 py-1.5 rounded-lg font-medium transition-colors ${viewDate.getMonth() === i ? "bg-brand-gold/20 text-brand-dark" : "hover:bg-brand-light/20 text-brand-soft"}`}>
              {m.substring(0,3)}
            </button>
          ))}
        </div>
      )}

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-brand-muted py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map(day => {
          const inWeek = isInSelectedWeek(day);
          const hasSheet = hasSheetOnDay(day);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
                ${inWeek ? "bg-brand-gold/20 text-brand-dark font-bold" : hasSheet ? "bg-success/15 text-green-700" : "hover:bg-brand-light/10 text-brand-soft"}
                ${isToday ? "ring-2 ring-brand-gold" : ""}`}
            >
              <span>{format(day, "d")}</span>
              {hasSheet && !inWeek && <span className="w-1 h-1 rounded-full bg-success mt-0.5" />}
              {inWeek && <span className="w-1 h-1 rounded-full bg-brand-gold mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
