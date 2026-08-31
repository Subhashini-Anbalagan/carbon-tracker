import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { navRoutes } from "../navRoutes";
import { useAuth } from "../../hooks/useAuth";
import { useProfileName } from "../../hooks/useProfileName";
import { useDailyTarget } from "../../hooks/useDailyTarget";
import { useUnit } from "../../hooks/useUnit";
import { formatCarbon, formatCarbonValue, unitLabel } from "../../utils/formatCarbon";
import { useLiveScore } from "../../hooks/useLiveScore";
import { useCategoryTotals } from "../../hooks/useCategoryTotals";
import { useTrend30Days } from "../../hooks/useTrend30Days";
import { useMonthStats } from "../../hooks/useMonthStats";
import { useMonthlyTrend } from "../../hooks/useMonthlyTrend";
import { useCarbonHeatmap } from "../../hooks/useCarbonHeatmap";
import { CarbonTicker } from "../components/dashboard/CarbonTicker";
import { CategoryPieChart } from "../components/charts/CategoryPieChart";
import { TrendLineChart } from "../components/charts/TrendLineChart";
import {
  Leaf, Brain, LayoutDashboard, Activity, BarChart3, FileText, Settings,
  Bell, Search, ChevronDown, TrendingDown, TrendingUp, Target, Award,
  Sparkles, Flame, Car, Utensils, Zap, Wind, ArrowDownRight, ArrowUpRight,
  CheckCircle2, ChevronRight, CalendarDays, Trophy, Zap as ZapIcon, Info, X
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from "recharts";

// ─── Data ─────────────────────────────────────────────────────────────────────

// pieData and trendData removed — real data now comes from
// useCategoryTotals / useTrend30Days, rendered via CategoryPieChart /
// TrendLineChart (Week 4 Day 4)

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Activity, label: "Activity Logger" },
  { icon: BarChart3, label: "Analytics", active: true },
  { icon: FileText, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getHeatColor = (v: number) => {
  if (v === 0) return "#F1F5F9";
  if (v < 4) return "#DCFCE7";
  if (v < 7) return "#86EFAC";
  if (v < 10) return "#4ADE80";
  if (v < 13) return "#F59E0B";
  return "#EF4444";
};

const getHeatOpacity = (v: number) => Math.min(0.3 + (v / 16) * 0.7, 1);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

// ChartTooltip and PieTooltip removed — CategoryPieChart and
// TrendLineChart now bring their own tooltip components

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({
  icon: Icon, label, value, unit, sub, change, accent, delay,
}: {
  icon: React.ElementType; label: string; value: string; unit: string;
  sub: string; change?: number; accent: string; delay: string;
}) => (
  <div
    className="rounded-2xl p-5 flex flex-col gap-3 cursor-default group relative overflow-hidden"
    style={{
      background: "#ffffff",
      border: "1px solid rgba(15,23,42,0.07)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
      animation: "fadeUp 0.5s ease forwards",
      animationDelay: delay,
      opacity: 0,
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget as HTMLDivElement;
      el.style.boxShadow = "0 4px 8px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.08)";
      el.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget as HTMLDivElement;
      el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)";
      el.style.transform = "translateY(0)";
    }}
  >
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: `radial-gradient(circle at top right, ${accent}08, transparent)`, transform: "translate(30%, -30%)" }} />
    <div className="flex items-center justify-between">
      <div className="flex items-center justify-center rounded-xl"
        style={{ width: 40, height: 40, background: `${accent}10` }}>
        <Icon size={18} style={{ color: accent }} strokeWidth={1.8} />
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
          style={{
            background: change <= 0 ? "rgba(22,163,74,0.08)" : "rgba(239,68,68,0.08)",
            color: change <= 0 ? "#16A34A" : "#EF4444",
          }}>
          {change <= 0 ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <div>
      <div className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>{label}</div>
      <div className="flex items-baseline gap-1.5 mb-0.5">
        <span className="font-bold tabular-nums" style={{ fontSize: 28, color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1 }}>
          {value}
        </span>
        <span className="text-sm font-medium" style={{ color: "#94A3B8" }}>{unit}</span>
      </div>
      <div className="text-xs" style={{ color: "#94A3B8" }}>{sub}</div>
    </div>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Analytics() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const displayName = useProfileName(user?.uid, user?.displayName);
  const [activeNav, setActiveNav] = useState("Analytics");
  const [selectedPeriod, setSelectedPeriod] = useState("30D");

  const [showNotif, setShowNotif] = useState(false);
  const [notifSeenCount, setNotifSeenCount] = useState(0);
  const [heatTooltip, setHeatTooltip] = useState<{ date: string; label: string; value: number; isFuture: boolean } | null>(null);
  // Live carbon score — realtime from Firestore, replaces the old random simulation
  const { totalCarbon, loading: scoreLoading } = useLiveScore(user?.uid);
  const { totals: categoryTotals, loading: totalsLoading } = useCategoryTotals(user?.uid);
  const { trend, loading: trendLoading } = useTrend30Days(user?.uid);
  const displayTrend = selectedPeriod === "7D" ? trend.slice(-7) : trend;
  const { stats: monthStats, loading: statsLoading } = useMonthStats(user?.uid);
  const { monthly, loading: monthlyLoading } = useMonthlyTrend(user?.uid);
  const { cells: heatmapCells, loading: heatmapLoading } = useCarbonHeatmap(user?.uid);

  const { dailyTarget: DAILY_TARGET } = useDailyTarget(user?.uid); // same daily budget used app-wide (ActivityLogger, SpinningGlobe, Settings)
  const { unit } = useUnit(user?.uid);

  const formatDayLabel = (dateStr?: string | null) => {
    if (!dateStr) return "No data yet";
    const d = new Date(dateStr + "T00:00:00");
    return d
      .toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })
      .replace(",", " ·");
  };

  // Monthly goal — real target (DAILY_TARGET × days in this month) vs real
  // month-to-date total from useCategoryTotals
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const monthlyGoal = DAILY_TARGET * daysInMonth;
  const monthlyActual = categoryTotals.total;
  const goalPct = monthlyGoal > 0 ? Math.min((monthlyActual / monthlyGoal) * 100, 100) : 0;

  const weeksInHeatmap = [
    heatmapCells.slice(0, 7),
    heatmapCells.slice(7, 14),
    heatmapCells.slice(14, 21),
    heatmapCells.slice(21, 28),
    heatmapCells.slice(28, 35),
  ];
  const heatmapRangeLabel = heatmapCells.length === 35
    ? `${heatmapCells[0].label} – ${heatmapCells[34].label}`
    : "";

  // Real consecutive-day streak — walks backward through the 30-day trend,
  // counting logged days at/under target; today is skipped (not broken) if
  // nothing's been logged yet today
  const computeStreak = (trendArr: typeof trend, target: number) => {
    let streak = 0;
    for (let i = trendArr.length - 1; i >= 0; i--) {
      const day = trendArr[i];
      if (i === trendArr.length - 1 && day.actual === 0) continue;
      if (day.actual > 0 && day.actual <= target) streak++;
      else break;
    }
    return streak;
  };
  const streakDay = trend.length > 0 ? computeStreak(trend, DAILY_TARGET) : 0;

  // Real AI Insights — derived from this month's category split, the
  // 6-month trend, current pace, and the streak above (no fabricated copy)
  const thisMonthTotal = monthly.length > 0 ? monthly[monthly.length - 1].co2 : 0;
  const lastMonthTotal = monthly.length > 1 ? monthly[monthly.length - 2].co2 : 0;

  const categoryEntries: [string, number][] = [
    ["Travel", categoryTotals.travel],
    ["Food", categoryTotals.food],
    ["Electricity", categoryTotals.electricity],
  ];
  const topCategory = categoryEntries.reduce((max, c) => (c[1] > max[1] ? c : max), categoryEntries[0]);
  const topCategoryPct = categoryTotals.total > 0 ? Math.round((topCategory[1] / categoryTotals.total) * 100) : 0;
  const topCategoryIcon = topCategory[0] === "Travel" ? Car : topCategory[0] === "Food" ? Utensils : Zap;

  const daysElapsed = new Date().getDate();
  const forecastTotal = daysElapsed > 0 ? +((categoryTotals.total / daysElapsed) * daysInMonth).toFixed(1) : 0;

  // Real notification alerts — derived from the same totals already computed on this page
  const notifAlerts: { id: string; text: string; time: string; dot: string }[] = [];
  if (categoryTotals.total > 0) {
    if (monthlyActual > monthlyGoal) {
      notifAlerts.push({ id: "n-goal-over", text: `Monthly goal exceeded by ${formatCarbon(monthlyActual - monthlyGoal, unit)}`, time: "This month", dot: "#EF4444" });
    } else if (goalPct >= 85) {
      notifAlerts.push({ id: "n-goal-warn", text: `${Math.round(goalPct)}% of monthly goal used — approaching limit`, time: "This month", dot: "#F59E0B" });
    }
  }
  if (streakDay >= 3) {
    notifAlerts.push({ id: "n-streak", text: `${streakDay}-day low-emission streak — keep it going!`, time: "Ongoing", dot: "#F59E0B" });
  }
  if (categoryTotals.total > 0 && forecastTotal <= monthlyGoal) {
    notifAlerts.push({ id: "n-forecast-good", text: `On pace to finish under your ${formatCarbon(monthlyGoal, unit)} monthly target`, time: "Forecast", dot: "#16A34A" });
  }
  const notifications = Math.max(0, notifAlerts.length - notifSeenCount);

  const aiInsights = [
    {
      id: 1, type: "trend",
      icon: lastMonthTotal > 0 && thisMonthTotal > lastMonthTotal ? TrendingUp : TrendingDown,
      color: lastMonthTotal > 0 && thisMonthTotal > lastMonthTotal ? "#EF4444" : "#16A34A",
      title: lastMonthTotal === 0
        ? "Building your monthly trend"
        : thisMonthTotal <= lastMonthTotal
          ? `Emissions down ${Math.round(((lastMonthTotal - thisMonthTotal) / lastMonthTotal) * 100)}% this month`
          : `Emissions up ${Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)}% this month`,
      body: lastMonthTotal === 0
        ? "Log a full month of activity to unlock a month-over-month comparison."
        : `You're at ${formatCarbon(thisMonthTotal, unit)} vs ${formatCarbon(lastMonthTotal, unit)} last month.`,
      tag: lastMonthTotal > 0 && thisMonthTotal > lastMonthTotal ? "Needs Attention" : "Positive Trend",
      tagColor: lastMonthTotal > 0 && thisMonthTotal > lastMonthTotal ? "#EF4444" : "#16A34A",
    },
    {
      id: 2, type: "opportunity", icon: topCategoryIcon, color: "#3B82F6",
      title: categoryTotals.total > 0 ? `${topCategory[0]} is your largest category` : "No activity logged yet",
      body: categoryTotals.total > 0
        ? `${topCategoryPct}% of your footprint this month comes from ${topCategory[0].toLowerCase()}.`
        : "Log a travel, food, or electricity action to see where your footprint comes from.",
      tag: "Opportunity", tagColor: "#3B82F6",
    },
    {
      id: 3, type: "forecast", icon: Brain, color: "#8B5CF6",
      title: categoryTotals.total > 0 ? `Forecast: ${formatCarbon(forecastTotal, unit)} by month end` : "Forecast unavailable",
      body: categoryTotals.total > 0
        ? forecastTotal <= monthlyGoal
          ? `At your current pace, you'll finish under your ${formatCarbon(monthlyGoal, unit)} monthly target.`
          : `At your current pace, you're on track to exceed your ${formatCarbon(monthlyGoal, unit)} monthly target by ${formatCarbon(forecastTotal - monthlyGoal, unit)}.`
        : "Log a few days of activity to see a month-end projection.",
      tag: "Forecast", tagColor: "#8B5CF6",
    },
    {
      id: 4, type: "streak", icon: Award, color: "#F59E0B",
      title: streakDay > 0 ? `${streakDay}-day low-emission streak` : "No active streak",
      body: streakDay > 0
        ? `You've stayed under ${formatCarbon(DAILY_TARGET, unit)}/day for ${streakDay} consecutive logged day${streakDay === 1 ? "" : "s"}.`
        : `Log a day under ${formatCarbon(DAILY_TARGET, unit)} to start a streak.`,
      tag: "Achievement", tagColor: "#F59E0B",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.1); border-radius: 4px; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tickerBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes streakPop {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to { width: var(--target-width); }
        }
        .notif-dot { width: 5px; height: 5px; background: #EF4444; border-radius: 50%; animation: tickerBlink 2s ease-in-out infinite; }
        .nav-item-btn { transition: background 0.12s; border: none; background: transparent; cursor: pointer; }
        .nav-item-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .heat-cell {
          transition: transform 0.12s ease, box-shadow 0.12s ease;
          cursor: pointer;
          border-radius: 5px;
        }
        .heat-cell:hover { transform: scale(1.25); z-index: 10; }
        .chart-card { transition: box-shadow 0.2s ease; }
        .chart-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.06), 0 20px 48px rgba(0,0,0,0.08) !important; }
        .insight-card { transition: background 0.15s, border-color 0.15s; }
        .insight-card:hover { background: #F8FAFC !important; border-color: rgba(15,23,42,0.12) !important; }
        .pie-legend-row { transition: opacity 0.15s; cursor: pointer; border-radius: 10px; padding: 6px 8px; }
        .pie-legend-row:hover { background: #F8FAFC; }
      `}</style>

      <div className="flex w-screen h-screen overflow-hidden" style={{ background: "#F8FAFC" }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className="flex flex-col h-full flex-shrink-0"
          style={{ width: 240, background: "#0F172A", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3 px-6 pt-7 pb-8">
            <div className="flex items-center justify-center rounded-xl"
              style={{ width: 36, height: 36, background: "linear-gradient(135deg, #16A34A, #4ADE80)", boxShadow: "0 4px 12px rgba(74,222,128,0.3)" }}>
              <Leaf size={18} color="white" strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-bold text-sm text-white" style={{ letterSpacing: "-0.01em" }}>EcoTrack AI</div>
              <div style={{ color: "#4ADE80", letterSpacing: "0.06em", fontSize: 10, fontWeight: 600 }}>CARBON INTELLIGENCE</div>
            </div>
          </div>

          <div className="px-5 mb-2">
            <span style={{ color: "#334155", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Main Menu</span>
          </div>

          <nav className="flex-1 px-3 flex flex-col gap-0.5">
            {navItems.map(({ icon: Icon, label, active }) => {
              const isActive = activeNav === label;
              return (
                <button key={label} onClick={() => {
                    setActiveNav(label);
                    if (navRoutes[label] && navRoutes[label] !== "/analytics") {
                      navigate(navRoutes[label]);
                    }
                  }}
                  className="nav-item-btn flex items-center gap-3 px-3 py-2.5 rounded-xl text-left w-full"
                  style={{ background: isActive ? "rgba(22,163,74,0.12)" : "transparent" }}>
                  <Icon size={17} strokeWidth={isActive ? 2 : 1.7}
                    style={{ color: isActive ? "#4ADE80" : "#475569", flexShrink: 0 }} />
                  <span className="text-sm font-medium" style={{ color: isActive ? "#F8FAFC" : "#64748B" }}>{label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#4ADE80" }} />}
                </button>
              );
            })}
          </nav>

          {/* Streak widget in sidebar */}
          <div className="px-4 pb-6">
            <div className="rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06))", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={14} style={{ color: "#F59E0B" }} strokeWidth={2} />
                <span style={{ color: "#F59E0B", fontSize: 11, fontWeight: 700 }}>Sustainability Streak</span>
              </div>
              <div className="flex items-end gap-1.5 mb-3">
                <span className="font-bold" style={{ fontSize: 32, color: "#F8FAFC", letterSpacing: "-0.04em", lineHeight: 1 }}>{streakDay}</span>
                <span style={{ color: "#64748B", fontSize: 13, marginBottom: 2 }}>days</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="flex-1 rounded-sm"
                    style={{
                      height: 4,
                      background: i < streakDay % 7 || streakDay >= 7 ? "#F59E0B" : "rgba(255,255,255,0.08)",
                      boxShadow: (i < streakDay % 7 || streakDay >= 7) ? "0 0 4px rgba(245,158,11,0.4)" : "none",
                    }} />
                ))}
              </div>
              <div style={{ color: "#64748B", fontSize: 11, marginTop: 6 }}>Under {formatCarbon(DAILY_TARGET, unit)}/day every day</div>
            </div>
          </div>
        </aside>

        {/* ── MAIN AREA ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* NAVBAR */}
          <header className="flex items-center justify-between px-8 flex-shrink-0"
            style={{
    height: 64,
    background: "rgba(248,250,252,0.9)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(15,23,42,0.07)",
    position: "relative",
    zIndex: 1000,
  }}
>
            <div>
              <h1 className="font-bold" style={{ fontSize: 16, color: "#0F172A", letterSpacing: "-0.02em" }}>Carbon Analytics</h1>
              <p style={{ fontSize: 12, color: "#94A3B8" }}>
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} · {selectedPeriod} overview
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Period selector */}
              <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "#F1F5F9", border: "1px solid rgba(15,23,42,0.07)" }}>
                {["7D", "30D", "3M", "1Y"].map((p) => {
  const isAvailable = p === "7D" || p === "30D";
  return (
    <button
      key={p}
      onClick={() => isAvailable && setSelectedPeriod(p)}
      disabled={!isAvailable}
      title={isAvailable ? undefined : "Needs longer history than is currently tracked"}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: selectedPeriod === p ? "#ffffff" : "transparent",
        color: !isAvailable ? "#CBD5E1" : selectedPeriod === p ? "#0F172A" : "#64748B",
        border: "none",
        cursor: isAvailable ? "pointer" : "not-allowed",
        boxShadow: selectedPeriod === p ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {p}
    </button>
  );
})}
              </div>

              {/* Live ticker */}
              <CarbonTicker totalCarbon={totalCarbon} loading={scoreLoading} />

              {/* Notification */}
              <div className="relative" style={{ zIndex: 1001 }}>
  <button
    onClick={() => setShowNotif((v) => !v)}
    className="relative flex items-center justify-center rounded-xl"
    style={{
      width: 38,
      height: 38,
      background: showNotif ? "rgba(22,163,74,0.08)" : "#ffffff",
      border: "1px solid rgba(15,23,42,0.08)",
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}
  >
    <Bell size={16} style={{ color: "#64748B" }} strokeWidth={1.8} />
    {notifications > 0 && (
      <span
        className="absolute flex items-center justify-center rounded-full text-white"
        style={{
          width: 14,
          height: 14,
          background: "#EF4444",
          fontSize: 8,
          fontWeight: 700,
          top: -3,
          right: -3,
          border: "2px solid #F8FAFC",
        }}
      >
        {notifications}
      </span>
    )}
  </button>

  {showNotif && (
    <div
      className="absolute right-0 top-12 rounded-2xl overflow-hidden"
      style={{
        width: 300,
        background: "#ffffff",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        zIndex: 1002,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
        <span className="font-semibold text-sm" style={{ color: "#0F172A" }}>Notifications</span>
        <button
          onClick={() => {
            setNotifSeenCount(notifAlerts.length);
            setShowNotif(false);
          }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
        >
          <X size={14} />
        </button>
      </div>

      {notifAlerts.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-slate-400">No alerts right now — you're on track.</p>
        </div>
      ) : (
        notifAlerts.map((n, i) => (
          <div
            key={n.id}
            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
            style={{ borderBottom: i < notifAlerts.length - 1 ? "1px solid rgba(15,23,42,0.04)" : "none" }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: n.dot }} />
            <div className="flex-1">
              <p className="text-xs text-slate-700">{n.text}</p>
              <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )}
</div>

              {/* Avatar */}
              <div className="flex items-center gap-2.5 cursor-pointer">
                <div className="flex items-center justify-center rounded-xl font-semibold"
                  style={{ width: 38, height: 38, background: "linear-gradient(135deg, #16A34A, #4ADE80)", color: "white", fontSize: 13, boxShadow: "0 2px 8px rgba(22,163,74,0.25)" }}>
                  {displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{displayName || "User"}</div>
                </div>
                <ChevronDown size={14} style={{ color: "#94A3B8" }} />
              </div>
              <button
                onClick={logout}
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  color: "#EF4444",
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Logout
              </button>
            </div>
          </header>

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto px-8 py-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KpiCard icon={Award} label="Best Day" value={statsLoading ? "…" : monthStats.bestDay ? formatCarbonValue(monthStats.bestDay.total, unit) : "—"} unit={`${unitLabel(unit)} CO₂`} sub={statsLoading ? "" : formatDayLabel(monthStats.bestDay?.date)} accent="#16A34A" delay="0.05s" />
              <KpiCard icon={Flame} label="Worst Day" value={statsLoading ? "…" : monthStats.worstDay ? formatCarbonValue(monthStats.worstDay.total, unit) : "—"} unit={`${unitLabel(unit)} CO₂`} sub={statsLoading ? "" : formatDayLabel(monthStats.worstDay?.date)} accent="#EF4444" delay="0.1s" />
              <KpiCard icon={BarChart3} label="Monthly Average" value={statsLoading ? "…" : monthStats.daysLogged > 0 ? formatCarbonValue(monthStats.average, unit) : "—"} unit={`${unitLabel(unit)} / day`} sub={statsLoading ? "" : `Across ${monthStats.daysLogged} logged day${monthStats.daysLogged === 1 ? "" : "s"}`} accent="#3B82F6" delay="0.15s" />
              <KpiCard icon={TrendingDown} label="Days Under Target" value={statsLoading ? "…" : monthStats.daysLogged > 0 ? `${monthStats.daysUnderTarget}/${monthStats.daysLogged}` : "—"} unit="" sub={`Target: ${formatCarbon(DAILY_TARGET, unit)}/day`} accent="#22C55E" delay="0.2s" />
            </div>

            {/* Middle row: Pie + Trend */}
            <div className="grid grid-cols-5 gap-4 mb-6">

              {/* Pie Chart — real Firestore data via CategoryPieChart (Week 4 Day 4) */}
              <div className="col-span-2" style={{ animation: "fadeUp 0.5s ease forwards", animationDelay: "0.25s", opacity: 0 }}>
                <CategoryPieChart totals={categoryTotals} loading={totalsLoading} />
              </div>

              {/* 30-Day Trend — real Firestore data via TrendLineChart (Week 4 Day 4) */}
              <div className="col-span-3" style={{ animation: "fadeUp 0.5s ease forwards", animationDelay: "0.3s", opacity: 0 }}>
                <TrendLineChart trend={displayTrend} loading={trendLoading} />
              </div>
            </div>

            {/* Bottom row: Heatmap + Insights + Goal */}
            <div className="grid grid-cols-3 gap-4">

              {/* Carbon Heatmap */}
              <div className="col-span-2 chart-card rounded-2xl p-5"
                style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)", animation: "fadeUp 0.5s ease forwards", animationDelay: "0.35s", opacity: 0 }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: "#0F172A", letterSpacing: "-0.01em" }}>Carbon Heatmap</h3>
                    <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Daily emissions intensity{heatmapRangeLabel ? ` — ${heatmapRangeLabel}` : ""}</p>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>Low</span>
                    {["#DCFCE7", "#86EFAC", "#4ADE80", "#22C55E", "#F59E0B", "#EF4444"].map((c) => (
                      <div key={c} className="rounded-sm" style={{ width: 16, height: 16, background: c }} />
                    ))}
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>High</span>
                  </div>
                </div>

                {/* Day labels */}
                <div className="flex gap-1 mb-1.5 pl-10">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="flex-1 text-center" style={{ fontSize: 10, color: "#94A3B8" }}>{d}</div>
                  ))}
                </div>

                {/* Grid */}
                <div className="flex flex-col gap-1">
                  {weeksInHeatmap.map((week, wi) => (
                    <div key={wi} className="flex items-center gap-1">
                      <div className="text-right pr-2" style={{ width: 36, fontSize: 10, color: "#94A3B8", flexShrink: 0 }}>
                        {week.length > 0 && (wi === 0 || week[0].monthLabel !== weeksInHeatmap[wi - 1][0]?.monthLabel) ? week[0].monthLabel : ""}
                      </div>
                      <div className="flex gap-1 flex-1">
                        {week.map((cell) => (
                          <div
                            key={cell.date}
                            className="heat-cell flex-1 relative"
                            style={{
                              height: 28,
                              background: getHeatColor(cell.value),
                              opacity: cell.isFuture ? 0.15 : getHeatOpacity(cell.value),
                              position: "relative",
                            }}
                            onMouseEnter={() => setHeatTooltip(cell)}
                            onMouseLeave={() => setHeatTooltip(null)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Heatmap tooltip */}
                {heatTooltip && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.08)" }}>
                    <CalendarDays size={13} style={{ color: "#64748B" }} />
                    <span style={{ fontSize: 12, color: "#64748B" }}>{heatTooltip.label}:</span>
                    {heatTooltip.isFuture ? (
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>No data yet</span>
                    ) : (
                      <>
                        <span className="font-bold" style={{ fontSize: 12, color: heatTooltip.value > 10 ? "#EF4444" : heatTooltip.value > 7 ? "#F59E0B" : "#16A34A" }}>
                          {heatTooltip.value} kg CO₂
                        </span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>
                          {heatTooltip.value === 0 ? "· No activity logged" : heatTooltip.value < 5 ? "· Excellent day 🌿" : heatTooltip.value < 8 ? "· Good day" : heatTooltip.value < 12 ? "· Moderate" : "· High emission day"}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right column: Insights + Goal */}
              <div className="col-span-1 flex flex-col gap-4">

                {/* Monthly Goal Tracker */}
                <div className="rounded-2xl p-4"
                  style={{ background: "linear-gradient(145deg, #0F172A, #071a0e)", border: "1px solid rgba(74,222,128,0.1)", boxShadow: "0 2px 4px rgba(0,0,0,0.08), 0 12px 24px rgba(0,0,0,0.12)", animation: "fadeUp 0.5s ease forwards", animationDelay: "0.38s", opacity: 0 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={14} style={{ color: "#4ADE80" }} strokeWidth={2} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80", textTransform: "uppercase", letterSpacing: "0.06em" }}>Monthly Goal</span>
                  </div>

                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.04em", lineHeight: 1 }}>
                        {formatCarbonValue(monthlyActual, unit)}
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#64748B", marginLeft: 4 }}>{unitLabel(unit)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>of {formatCarbon(monthlyGoal, unit)} target</div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#4ADE80", letterSpacing: "-0.03em" }}>{Math.round(100 - goalPct)}%</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>remaining</div>
                    </div>
                  </div>

                  <div className="rounded-full overflow-hidden mb-1.5" style={{ height: 6, background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full"
                      style={{
                        width: `${goalPct}%`,
                        background: goalPct < 60 ? "linear-gradient(90deg, #16A34A, #4ADE80)" : goalPct < 85 ? "linear-gradient(90deg, #F59E0B, #FCD34D)" : "linear-gradient(90deg, #EF4444, #F87171)",
                        transition: "width 1s ease",
                        boxShadow: "0 0 8px rgba(74,222,128,0.4)",
                      }} />
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontSize: 10, color: "#475569" }}>{formatCarbon(0, unit)}</span>
                    <span style={{ fontSize: 10, color: "#475569" }}>{formatCarbon(monthlyGoal, unit)}</span>
                  </div>

                  {/* Milestone dots */}
                  <div className="flex gap-1.5 mt-3">
                    {[25, 50, 75, 100].map((m) => (
                      <div key={m} className="flex-1 flex flex-col items-center gap-1">
                        <div className="rounded-full"
                          style={{ width: 8, height: 8, background: goalPct >= m ? "#4ADE80" : "rgba(255,255,255,0.08)", boxShadow: goalPct >= m ? "0 0 6px #4ADE80" : "none" }} />
                        <span style={{ fontSize: 9, color: "#334155" }}>{m}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="rounded-2xl overflow-hidden flex-1"
                  style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animation: "fadeUp 0.5s ease forwards", animationDelay: "0.43s", opacity: 0 }}>
                  <div className="px-4 py-3.5 flex items-center gap-2.5"
                    style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
                    <div className="flex items-center justify-center rounded-xl"
                      style={{ width: 28, height: 28, background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                      <Brain size={13} color="white" strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em" }}>AI Insights</div>
                      <div className="flex items-center gap-1.5">
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
                        <span style={{ fontSize: 10, color: "#64748B" }}>4 new insights</span>
                      </div>
                    </div>
                    <Sparkles size={13} style={{ color: "#7C3AED", marginLeft: "auto" }} />
                  </div>

                  <div className="divide-y overflow-y-auto" style={{ maxHeight: 280 }}>
                    {aiInsights.map((ins) => {
                      const Icon = ins.icon;
                      return (
                        <div key={ins.id} className="insight-card px-4 py-3 cursor-pointer"
                          style={{ background: "#ffffff", borderColor: "rgba(15,23,42,0.06)" }}>
                          <div className="flex items-start gap-2.5">
                            <div className="flex items-center justify-center rounded-xl flex-shrink-0 mt-0.5"
                              style={{ width: 28, height: 28, background: `${ins.color}10` }}>
                              <Icon size={12} style={{ color: ins.color }} strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                                  style={{ background: `${ins.tagColor}10`, color: ins.tagColor, fontSize: 9, whiteSpace: "nowrap" }}>
                                  {ins.tag}
                                </span>
                              </div>
                              <p style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", lineHeight: 1.4, marginBottom: 3 }}>{ins.title}</p>
                              <p style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.5 }}>{ins.body}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}