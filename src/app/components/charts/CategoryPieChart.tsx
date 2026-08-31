import { useState } from "react";
import { Car, Utensils, Zap, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORIES = [
  { key: "travel", name: "Travel", color: "#3B82F6", icon: Car },
  { key: "food", name: "Food", color: "#F59E0B", icon: Utensils },
  { key: "electricity", name: "Electricity", color: "#8B5CF6", icon: Zap },
] as const;

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl px-3 py-2.5" style={{
      background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)", fontSize: 12,
    }}>
      <div className="font-semibold text-white text-xs mb-1">{d.name}</div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: d.payload.color }} />
        <span style={{ color: "#94A3B8" }}>Share:</span>
        <span className="font-semibold text-white">{d.payload.pct}%</span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span style={{ color: "#94A3B8" }}>Amount:</span>
        <span className="font-semibold text-white">{d.value} kg</span>
      </div>
    </div>
  );
};

interface CategoryPieChartProps {
  totals: { travel: number; food: number; electricity: number; total: number };
  loading: boolean;
}

export const CategoryPieChart = ({ totals, loading }: CategoryPieChartProps) => {
  const [activePie, setActivePie] = useState<number | null>(null);

  const pieData = CATEGORIES
    .map((c) => ({
      ...c,
      value: totals[c.key],
      pct: totals.total > 0 ? Math.round((totals[c.key] / totals.total) * 100) : 0,
    }))
    .filter((d) => d.value > 0);

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="chart-card rounded-2xl p-5"
      style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
      <div className="mb-4">
        <h3 className="font-semibold text-sm" style={{ color: "#0F172A", letterSpacing: "-0.01em" }}>Emission Sources</h3>
        <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
          {monthLabel} · {totals.total} kg total
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2" style={{ height: 180 }}>
          <Loader2 size={18} className="animate-spin" style={{ color: "#94A3B8" }} />
          <span className="text-xs" style={{ color: "#94A3B8" }}>Loading your data…</span>
        </div>
      ) : pieData.length === 0 ? (
        <div className="flex items-center justify-center text-center" style={{ height: 180 }}>
          <span className="text-xs" style={{ color: "#94A3B8" }}>Log an action to see your breakdown here.</span>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div style={{ width: 180, height: 180, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={82}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, i) => setActivePie(i)}
                  onMouseLeave={() => setActivePie(null)}
                >
                  {pieData.map((entry, i) => (
                    <Cell
                      key={entry.key}
                      fill={entry.color}
                      opacity={activePie === null || activePie === i ? 1 : 0.35}
                      stroke="none"
                      style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                    />
                  ))}
                  <text x="50%" y="46%" textAnchor="middle" fill="#0F172A"
                    style={{ fontSize: 20, fontWeight: 700, fontFamily: "Inter", letterSpacing: "-0.04em" }}>
                    {totals.total}
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" fill="#94A3B8"
                    style={{ fontSize: 11, fontFamily: "Inter" }}>
                    kg CO₂ / month
                  </text>
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 flex flex-col gap-0.5">
            {pieData.map((d, i) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.key}
                  className="pie-legend-row flex items-center gap-2.5"
                  onMouseEnter={() => setActivePie(i)}
                  onMouseLeave={() => setActivePie(null)}
                >
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 26, height: 26, background: `${d.color}12` }}>
                    <Icon size={13} style={{ color: d.color }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: "#0F172A" }}>{d.name}</span>
                      <span className="text-xs font-bold" style={{ color: d.color }}>{d.pct}%</span>
                    </div>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>{d.value} kg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};