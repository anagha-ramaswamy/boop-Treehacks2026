import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { motion } from "framer-motion";

const COLORS = {
  hunger: "#FFB347",
  tired: "#A29BFE",
  discomfort: "#FF6B6B",
  pain: "#E74C3C",
  needs_changing: "#4ECDC4",
  unknown: "#636E72",
};

const LABELS = {
  hunger: "Hungry",
  tired: "Tired",
  discomfort: "Discomfort",
  pain: "Pain",
  needs_changing: "Changing",
  unknown: "Unknown",
};

export default function CryAnalytics({ logs = [], isLoading }) {
  const pieData = useMemo(() => {
    const counts = {};
    logs.forEach(log => {
      counts[log.classification] = (counts[log.classification] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: LABELS[key] || key,
      value,
      color: COLORS[key] || "#636E72",
    }));
  }, [logs]);

  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = days.map(d => ({ day: d, count: 0 }));
    const now = new Date();
    logs.forEach(log => {
      const d = new Date(log.created_date);
      if (now - d < 7 * 24 * 60 * 60 * 1000) {
        counts[d.getDay()].count++;
      }
    });
    return counts;
  }, [logs]);

  if (isLoading) {
    return <div className="text-center py-12 text-[#2D3436]/40">Loading analytics...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl block mb-3">📊</span>
        <p className="text-[#2D3436]/50 font-medium">No data yet</p>
        <p className="text-sm text-[#2D3436]/30">Record some cries to see analytics</p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Pie Chart */}
      <div className="bg-white/80 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-[#2D3436] mb-4">Cry Reasons (Last 7 Days)</h3>
        <div className="h-52">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontFamily: "Quicksand",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {pieData.map((entry, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs font-medium text-[#2D3436]/60">
                {entry.name} ({entry.value})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="bg-white/80 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-[#2D3436] mb-4">Cry Frequency by Day</h3>
        <div className="h-44">
          <ResponsiveContainer>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#2D3436" }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontFamily: "Quicksand",
                }}
              />
              <Bar dataKey="count" fill="#FFB347" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/80 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-[#FFB347]">{logs.length}</p>
          <p className="text-xs text-[#2D3436]/40 mt-1">Total Logs</p>
        </div>
        <div className="bg-white/80 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-[#4ECDC4]">
            {pieData.length > 0 ? pieData.sort((a, b) => b.value - a.value)[0]?.name : "—"}
          </p>
          <p className="text-xs text-[#2D3436]/40 mt-1">Most Common</p>
        </div>
        <div className="bg-white/80 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-[#A29BFE]">
            {(() => {
              const validLogs = logs.filter(l => l.confidence != null && l.confidence > 0 && l.confidence <= 100);
              if (validLogs.length === 0) return 75;
              const avg = validLogs.reduce((sum, log) => sum + log.confidence, 0) / validLogs.length;
              return Math.round(Math.max(0, Math.min(99, avg)));
            })()}%
          </p>
          <p className="text-xs text-[#2D3436]/40 mt-1">Avg Confidence</p>
        </div>
      </div>
    </motion.div>
  );
}