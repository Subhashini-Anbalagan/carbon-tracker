import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5" style={{
      background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)", fontSize: 12,
    }}>
      <div className="font-semibold mb-1.5 text-white text-xs">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "#94A3B8" }}>{p.name}:</span>
          <span className="font-semibold text-white">{p.value} kg</span>
        </div>
      ))}
    </div>
  );
};

interface TrendLineChartProps {
  trend: Array<{ day: number; label: string; actual: number; avg: number }>;
  loading: boolean;
  dailyTarget?: number;
}

export const TrendLineChart = ({ trend, loading, dailyTarget = 15 }: TrendLineChartProps) => {
  const data = trend.map((t) => ({ ...t, target: dailyTarget }));
  const hasData = trend.some((t) => t.actual > 0);

  return (
    <div className="chart-card rounded-2xl p-5"
      style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: "#0F172A", letterSpacing: "-0.01em" }}>30-Day Emission Trend</h3>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Daily CO₂ vs target</p>
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: "Actual", color: "#16A34A", dash: false },
            { label: "Target", color: "#94A3B8", dash: true },
            { label: "Average", color: "#3B82F6", dash: true },
          ].map(({ label, color, dash }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div style={{
                width: 20, height: 2, background: dash ? "none" : color,
                borderTop: dash ? `2px dashed ${color}` : "none",
                borderRadius: 2,
              }} />
              <span style={{ fontSize: 11, color: "#64748B" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2" style={{ height: 200 }}>
          <Loader2 size={18} className="animate-spin" style={{ color: "#94A3B8" }} />
          <span className="text-xs" style={{ color: "#94A3B8" }}>Loading your data…</span>
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center text-center" style={{ height: 200 }}>
          <span className="text-xs" style={{ color: "#94A3B8" }}>Log actions over a few days to see your trend here.</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="actual" name="Actual" stroke="#16A34A" strokeWidth={2}
              fill="url(#trendGreen)" dot={false} activeDot={{ r: 4, fill: "#16A34A" }} />
            <Line type="monotone" dataKey="target" name="Target" stroke="#94A3B8" strokeWidth={1.5}
              strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="avg" name="Average" stroke="#3B82F6" strokeWidth={1.5}
              strokeDasharray="4 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};