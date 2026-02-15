import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";

const CLASS_COLORS = {
  normal: "#22C55E",
  concerning: "#EAB308",
  alert: "#EF4444",
};

export default function DiaperCalendar({ logs = [], isLoading }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const logsByDate = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      const dateKey = format(new Date(log.created_date), "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(log);
    });
    return map;
  }, [logs]);

  const getDayStatus = (date) => {
    const key = format(date, "yyyy-MM-dd");
    const dayLogs = logsByDate[key];
    if (!dayLogs || dayLogs.length === 0) return null;
    if (dayLogs.some(l => l.classification === "alert")) return "alert";
    if (dayLogs.some(l => l.classification === "concerning")) return "concerning";
    return "normal";
  };

  const selectedLogs = selectedDate ? (logsByDate[format(selectedDate, "yyyy-MM-dd")] || []) : [];
  const startDay = days[0]?.getDay() || 0;

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-2">
        <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))}>
          <ChevronLeft className="w-5 h-5 text-[#2D3436]/50" />
        </button>
        <h3 className="font-bold text-[#2D3436]">{format(currentMonth, "MMMM yyyy")}</h3>
        <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))}>
          <ChevronRight className="w-5 h-5 text-[#2D3436]/50" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-[#2D3436]/30 py-1">{d}</div>
        ))}

        {/* Empty cells */}
        {[...Array(startDay)].map((_, i) => <div key={`empty-${i}`} />)}

        {/* Days */}
        {days.map(day => {
          const status = getDayStatus(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium relative transition-all ${
                isSelected ? "ring-2 ring-[#FFB347] bg-[#FFE66D]/30" : ""
              } ${isToday(day) ? "font-bold" : ""}`}
              onClick={() => setSelectedDate(day)}
            >
              <span className="text-[#2D3436]">{format(day, "d")}</span>
              {status && (
                <div
                  className="w-4 h-4 rounded-full shadow-md absolute bottom-1 right-1"
                  style={{ backgroundColor: CLASS_COLORS[status] }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date details */}
      {selectedDate && (
        <motion.div
          className="bg-white/80 rounded-3xl p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="font-bold text-[#2D3436] mb-3">
            {format(selectedDate, "MMMM d, yyyy")}
          </h4>
          {selectedLogs.length === 0 ? (
            <p className="text-sm text-[#2D3436]/40">No entries for this day</p>
          ) : (
            <div className="space-y-2">
              {selectedLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
                  {log.photo_url && (
                    <img src={log.photo_url} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: CLASS_COLORS[log.classification] }}
                      >
                        {log.classification}
                      </span>
                      <span className="text-xs text-[#2D3436]/40">{log.confidence}%</span>
                    </div>
                    {log.clinical_note && (
                      <p className="text-xs text-[#2D3436]/60 mt-1 line-clamp-2">{log.clinical_note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}