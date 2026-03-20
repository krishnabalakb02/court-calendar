"use client";

import { useState, useMemo } from "react";
import type { CalendarEvent } from "@/lib/calendar";

interface CaseCalendarProps {
  events: CalendarEvent[];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDate(isoDate: string): string {
  const [yyyy, mm, dd] = isoDate.split("-");
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return d.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function CaseCalendar({ events }: CaseCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const todayIso = useMemo(() => {
    const now = new Date();
    return toIso(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const existing = map.get(ev.hearingDate) ?? [];
      map.set(ev.hearingDate, [...existing, ev]);
    }
    return map;
  }, [events]);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () =>
    setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(year, month + 1, 1));

  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2
          className="text-xl font-semibold text-slate-800"
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
        >
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
        {/* Day headers */}
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="bg-slate-50 text-center text-xs font-semibold text-slate-400 py-2.5 tracking-wide"
          >
            {day}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="bg-white min-h-[80px]" />;
          }

          const isoDate = toIso(year, month, day);
          const dayEvents = eventsByDate.get(isoDate) ?? [];
          const isToday = isoDate === todayIso;
          const isSelected = isoDate === selectedDate;
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={isoDate}
              onClick={() => hasEvents && setSelectedDate(isSelected ? null : isoDate)}
              className={[
                "bg-white min-h-[80px] p-1.5 transition-colors duration-150",
                hasEvents ? "cursor-pointer hover:bg-blue-50/40" : "",
                isToday ? "bg-blue-50/60" : "",
                isSelected ? "ring-2 ring-inset ring-blue-500" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                  isToday
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-500",
                ].join(" ")}
              >
                {day}
              </span>

              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className="truncate rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-700 font-medium leading-tight"
                    title={`${ev.caseNumber} — ${ev.stage}`}
                  >
                    {ev.caseNumber}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-slate-400 pl-1">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected date detail panel */}
      {selectedDate && selectedEvents.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-semibold text-slate-800"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              Cases on {formatDate(selectedDate)}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            {selectedEvents.map((ev) => (
              <div key={ev.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="font-semibold text-slate-800 text-sm"
                    style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                  >
                    {ev.caseNumber}
                  </span>
                  {ev.stage && (
                    <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {ev.stage}
                    </span>
                  )}
                </div>
                {ev.courtHall && (
                  <p className="text-xs text-slate-500 mt-1">Court: {ev.courtHall}</p>
                )}
                {ev.parties && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{ev.parties}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
