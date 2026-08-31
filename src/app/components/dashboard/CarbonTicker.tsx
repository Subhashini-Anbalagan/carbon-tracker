import { TrendingUp } from "lucide-react";

// Same visual style as the old Dashboard.tsx ticker — now driven by real
// Firestore data from useLiveScore.js instead of a Math.random() simulation.
export const CarbonTicker = ({ totalCarbon, loading }: { totalCarbon: number; loading: boolean }) => {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-2"
      style={{
        background: "rgba(22,163,74,0.06)",
        border: "1px solid rgba(22,163,74,0.15)",
      }}
    >
      <div className="notif-dot" />
      <span className="text-xs font-medium" style={{ color: "#64748B" }}>Live CO₂</span>
      <span className="font-bold text-sm tabular-nums" style={{ color: "#16A34A", letterSpacing: "-0.02em" }}>
        {loading ? "…" : totalCarbon.toFixed(2)} <span className="font-medium text-xs">kg</span>
      </span>
      <TrendingUp size={13} style={{ color: "#4ADE80" }} />
    </div>
  );
};