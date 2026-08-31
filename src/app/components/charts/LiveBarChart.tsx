import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

const BarTooltip = ({ active, payload, label }: any) => {
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

interface LiveBarChartProps {
  week: Array<{ day: string; travel: number; food: number; electricity: number }>;
  loading: boolean;
}

export const LiveBarChart = ({ week, loading }: LiveBarChartProps) => {
  const hasData = week.some((d) => d.travel + d.food + d.electricity > 0);

  return (
    <div className="chart-card rounded-2xl p-5"
      style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: "#0F172A", letterSpacing: "-0.01em" }}>Weekly Emissions</h3>
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Breakdown by category · this week</p>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: "#94A3B8" }}>
          {[
            { label: "Travel", color: "#3B82F6" },
            { label: "Food", color: "#F59E0B" },
            { label: "Electricity", color: "#8B5CF6" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2" style={{ height: 180 }}>
          <Loader2 size={18} className="animate-spin" style={{ color: "#94A3B8" }} />
          <span className="text-xs" style={{ color: "#94A3B8" }}>Loading your data…</span>
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center text-center" style={{ height: 180 }}>
          <span className="text-xs" style={{ color: "#94A3B8" }}>Log an action to see this week's chart.</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={week} barSize={8} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<BarTooltip />} />
            <Bar dataKey="travel" name="Travel" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="food" name="Food" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            <Bar dataKey="electricity" name="Electricity" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};