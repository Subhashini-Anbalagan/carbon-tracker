import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { navRoutes } from "../navRoutes";
import { useAuth } from "../../hooks/useAuth";
import { useProfileName } from "../../hooks/useProfileName";
import { useDailyTarget } from "../../hooks/useDailyTarget";
import { useUnit } from "../../hooks/useUnit";
import { formatCarbon, formatCarbonValue, unitLabel } from "../../utils/formatCarbon";
import { askGreenAI } from "../../services/geminiAPI";
import { useLiveScore } from "../../hooks/useLiveScore";
import { useWeekScores } from "../../hooks/useWeekScores";
import { useCategoryTotals } from "../../hooks/useCategoryTotals";
import { useMonthlyTrend } from "../../hooks/useMonthlyTrend";
import { CarbonTicker } from "../components/dashboard/CarbonTicker";
import { SpinningGlobe } from "../components/dashboard/SpinningGlobe";
import { Qbit } from "../components/dashboard/Qbit";
import { TipFeed } from "../components/dashboard/TipFeed";
import { LiveBarChart } from "../components/charts/LiveBarChart";
import { useTipFeed } from "../../hooks/useTipFeed";
import {
  Globe, Leaf, Brain, TrendingUp, Zap, Car, Utensils, Battery,
  LayoutDashboard, Activity, BarChart3, FileText, Settings,
  Bell, Search, ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight,
  Sparkles, SendHorizonal, Wind, Droplets, TreePine, Target,
  AlertCircle, CheckCircle2, Info, X, User, ChevronRight
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── Data ───────────────────────────────────────────────────────────────────

// weeklyData removed — real data now comes from useWeekScores,
// rendered via LiveBarChart (Week 4 Day 4)

// monthlyData removed — real data now comes from useMonthlyTrend
// categoryData removed — real data now comes from useCategoryTotals

const timeAgo = (timestamp: any) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const CATEGORY_LABEL: Record<string, string> = {
  travel: "Travel", food: "Food", electricity: "Electricity",
};
const CATEGORY_COLOR: Record<string, string> = {
  travel: "#3B82F6", food: "#F59E0B", electricity: "#8B5CF6",
};
const CATEGORY_ICON: Record<string, React.ElementType> = {
  travel: Car, food: Utensils, electricity: Zap,
};

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Activity, label: "Activity Logger", active: false },
  { icon: BarChart3, label: "Analytics", active: false },
  { icon: FileText, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const MetricCard = ({
  icon: Icon,
  label,
  value,
  unit,
  change,
  changeLabel,
  accent,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  change?: number;
  changeLabel?: string;
  accent: string;
  delay: string;
}) => {
  const isUp = typeof change === "number" && change > 0;
  return (
    <div
      className="relative rounded-2xl p-5 flex flex-col gap-3 cursor-default overflow-hidden group"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(15,23,42,0.07)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
        animation: `fadeUp 0.5s ease forwards`,
        animationDelay: delay,
        opacity: 0,
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 8px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at top right, ${accent}10, transparent)` }}
      />
      <div className="flex items-center justify-between">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ width: 40, height: 40, background: `${accent}12` }}
        >
          <Icon size={18} style={{ color: accent }} strokeWidth={1.8} />
        </div>
                {typeof change === "number" && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full`}
            style={{
              background: isUp ? "rgba(239,68,68,0.08)" : "rgba(22,163,74,0.08)",
              color: isUp ? "#EF4444" : "#16A34A",
            }}
          >
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="font-bold" style={{ fontSize: 26, color: "#0F172A", letterSpacing: "-0.03em" }}>{value}</span>
          <span className="text-sm font-medium" style={{ color: "#94A3B8" }}>{unit}</span>
        </div>
        {changeLabel && <div className="text-xs mt-1" style={{ color: "#94A3B8" }}>{changeLabel}</div>}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        background: "#0F172A",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        fontSize: 12,
      }}
    >
      <div className="font-semibold mb-1.5 text-white">{label}</div>
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

// ─── Main App ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const displayName = useProfileName(user?.uid, user?.displayName);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [aiInput, setAiInput] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiAsking, setAiAsking] = useState(false);

  const handleAskAI = async () => {
    if (!aiInput.trim() || aiAsking) return;
    setAiAsking(true);
    setAiAnswer("");
    const answer = await askGreenAI(aiInput.trim());
    setAiAnswer(answer);
    setAiAsking(false);
  };
  const [notifSeenCount, setNotifSeenCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const SEARCHABLE_PAGES = [
    { label: "Dashboard", icon: LayoutDashboard, hint: "Overview & live score" },
    { label: "Activity Logger", icon: Activity, hint: "Log travel, food, electricity" },
    { label: "Analytics", icon: BarChart3, hint: "Charts & heatmap" },
    { label: "Reports", icon: FileText, hint: "Monthly reports & PDF" },
    { label: "Settings", icon: Settings, hint: "Profile & preferences" },
  ];
  const searchResults = searchQuery.trim()
    ? SEARCHABLE_PAGES.filter((p) => p.label.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : SEARCHABLE_PAGES;

  const goToPage = (label: string) => {
    setActiveNav(label);
    setSearchQuery("");
    setShowSearchResults(false);
    if (navRoutes[label] && navRoutes[label] !== "/dashboard") {
      navigate(navRoutes[label]);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSearchResults(true);
      }
      if (e.key === "Escape") {
        setShowSearchResults(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Live carbon score — realtime from Firestore, replaces the old random simulation
  const { totalCarbon, loading: scoreLoading } = useLiveScore(user?.uid);

  // This week's category totals — realtime from Firestore, replaces the hardcoded weeklyData
  const { week, loading: weekLoading } = useWeekScores(user?.uid);
  const { totals: categoryTotals, loading: totalsLoading } = useCategoryTotals(user?.uid);
  const { monthly, loading: monthlyLoading } = useMonthlyTrend(user?.uid);
  const hasMonthlyData = monthly.some((m) => m.co2 > 0);
  const categoryData = [
    { category: "Travel", value: categoryTotals.total > 0 ? Math.round((categoryTotals.travel / categoryTotals.total) * 100) : 0, color: "#3B82F6" },
    { category: "Food", value: categoryTotals.total > 0 ? Math.round((categoryTotals.food / categoryTotals.total) * 100) : 0, color: "#F59E0B" },
    { category: "Electricity", value: categoryTotals.total > 0 ? Math.round((categoryTotals.electricity / categoryTotals.total) * 100) : 0, color: "#8B5CF6" },
  ].filter((d) => d.value > 0);

  // Live Gemini AI tips — realtime from Firestore, replaces the hardcoded aiMessages
  const { tips, loading: tipsLoading } = useTipFeed(user?.uid);

  const { dailyTarget: DAILY_TARGET_KG } = useDailyTarget(user?.uid);
  const { unit } = useUnit(user?.uid);
  const pctToGoal = Math.min(100, Math.round((totalCarbon / DAILY_TARGET_KG) * 100));
  const kgLeft = Math.max(0, DAILY_TARGET_KG - totalCarbon);
  const isLowEmission = totalCarbon <= DAILY_TARGET_KG;
  const thisMonthTotal = monthly.length > 0 ? monthly[monthly.length - 1]?.co2 ?? 0 : 0;
  const weekTotal = week.reduce((sum, d) => sum + d.travel + d.food + d.electricity, 0);
  const monthlyAvg = monthly.length > 0 ? monthly.reduce((sum, m) => sum + m.co2, 0) / monthly.length : 0;
  const annualPaceTons = (monthlyAvg * 12) / 1000;

  // Derived alerts — computed live from real totals, not stored separately
  const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay(); // Mon=1..Sun=7
  const weeklyTargetSoFar = DAILY_TARGET_KG * todayDow;
  const weeklyOnTrack = weekTotal <= weeklyTargetSoFar;

  const derivedAlerts: any[] = [];
  if (!scoreLoading && totalCarbon > DAILY_TARGET_KG) {
    derivedAlerts.push({
      id: "alert-high-emission",
      kind: "alert",
      icon: AlertCircle,
      color: "#EF4444",
      text: `High emission day — ${formatCarbon(totalCarbon - DAILY_TARGET_KG, unit)} over today's target`,
      time: "Today",
    });
  }
  if (!weekLoading && weekTotal > 0) {
    derivedAlerts.push({
      id: "alert-weekly-goal",
      kind: "alert",
      icon: weeklyOnTrack ? CheckCircle2 : AlertCircle,
      color: weeklyOnTrack ? "#16A34A" : "#F59E0B",
      text: weeklyOnTrack
        ? "Weekly goal on track — keep it up"
        : `Weekly goal exceeded by ${formatCarbon(weekTotal - weeklyTargetSoFar, unit)} so far`,
      time: "This week",
    });
  }

  const notifItems = [...derivedAlerts, ...tips.map((t: any) => ({ id: t.id, kind: "tip", ...t }))];
  const notifications = Math.max(0, notifItems.length - notifSeenCount);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.12); border-radius: 4px; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes tickerBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes rotateOrbit {
          from { transform: rotate(0deg) translateX(110px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(110px) rotate(-360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .nav-item:hover { background: rgba(255,255,255,0.06); }
        .nav-item-active { background: rgba(22,163,74,0.12) !important; }
        .chart-card { transition: box-shadow 0.2s ease; }
        .chart-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.06), 0 20px 48px rgba(0,0,0,0.08) !important; }
        .notif-dot {
          width: 6px; height: 6px; background: #EF4444; border-radius: 50%;
          animation: tickerBlink 2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex w-screen h-screen overflow-hidden" style={{ background: "#F8FAFC" }}>

        {/* ─── LEFT SIDEBAR ─────────────────────────────────────────────── */}
        <aside
          className="flex flex-col h-full flex-shrink-0"
          style={{
            width: 240,
            background: "#0F172A",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 pt-7 pb-8">
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{
                width: 36,
                height: 36,
                background: "linear-gradient(135deg, #16A34A, #4ADE80)",
                boxShadow: "0 4px 12px rgba(74,222,128,0.3)",
              }}
            >
              <Leaf size={18} color="white" strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-tight" style={{ letterSpacing: "-0.01em" }}>EcoTrack AI</div>
              <div className="text-xs font-medium" style={{ color: "#4ADE80", letterSpacing: "0.06em", fontSize: 10 }}>CARBON INTELLIGENCE</div>
            </div>
          </div>

          {/* Nav label */}
          <div className="px-5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#334155", fontSize: 10 }}>Main Menu</span>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-3 flex flex-col gap-0.5">
            {navItems.map(({ icon: Icon, label }) => {
              const isActive = activeNav === label;
              return (
                <button
                  key={label}
                  onClick={() => {
                    setActiveNav(label);
                    if (navRoutes[label] && navRoutes[label] !== "/dashboard") {
                      navigate(navRoutes[label]);
                    }
                  }}
                  className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-left w-full transition-all duration-150 ${isActive ? "nav-item-active" : ""}`}
                  style={{ cursor: "pointer", border: "none", background: "transparent" }}
                >
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2 : 1.7}
                    style={{ color: isActive ? "#4ADE80" : "#475569", flexShrink: 0 }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: isActive ? "#F8FAFC" : "#64748B" }}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#4ADE80" }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar bottom – emission status */}
          <div className="px-4 pb-6">
            <div
              className="rounded-2xl p-4"
              style={{
                background: "linear-gradient(135deg, rgba(22,163,74,0.12), rgba(74,222,128,0.06))",
                border: "1px solid rgba(74,222,128,0.15)",
              }}
            >
                            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: isLowEmission ? "#4ADE80" : "#EF4444", boxShadow: isLowEmission ? "0 0 6px #4ADE80" : "0 0 6px #EF4444" }} />
                <span className="text-xs font-semibold" style={{ color: isLowEmission ? "#4ADE80" : "#EF4444" }}>{isLowEmission ? "Low Emission Day" : "High Emission Day"}</span>
              </div>
              <div className="text-xs" style={{ color: "#64748B" }}>
                {isLowEmission ? "You're on track to meet your daily target. Keep it up!" : "You've gone over today's target."}
              </div>
              <div className="mt-3 rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pctToGoal}%`, background: "linear-gradient(90deg, #16A34A, #4ADE80)" }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: "#475569" }}>{pctToGoal}% to goal</span>
                <span className="text-xs" style={{ color: "#4ADE80" }}>{formatCarbon(kgLeft, unit)} left</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── MAIN AREA ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* TOP NAVBAR */}
          <header
            className="flex items-center justify-between px-8 flex-shrink-0"
            style={{
              height: 64,
              background: "rgba(248,250,252,0.85)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(15,23,42,0.07)",
              position: "relative",
              zIndex: 1000,
            }}
          >
            {/* Left – search */}
            <div className="relative" style={{ width: 260 }}>
              <div
                className="flex items-center gap-2.5 rounded-xl px-4 py-2"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(15,23,42,0.08)",
                  width: 260,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <Search size={15} style={{ color: "#94A3B8" }} strokeWidth={1.8} />
                <input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 120)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchResults.length > 0) {
                      goToPage(searchResults[0].label);
                    }
                  }}
                  placeholder="Search anything..."
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: "#0F172A",
                    width: "100%",
                    fontFamily: "inherit",
                  }}
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}
                  >
                    <X size={12} />
                  </button>
                ) : (
                  <kbd
                    className="text-xs rounded-md px-1.5 py-0.5 font-mono"
                    style={{ background: "#F1F5F9", color: "#94A3B8", fontSize: 10, border: "1px solid rgba(15,23,42,0.08)" }}
                  >
                    ⌘K
                  </kbd>
                )}
              </div>

              {showSearchResults && (
                <div
                  className="absolute left-0 top-11 rounded-2xl overflow-hidden"
                  style={{
                    width: 280,
                    background: "#ffffff",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    zIndex: 1001,
                  }}
                >
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs text-slate-400">No pages match "{searchQuery}"</p>
                    </div>
                  ) : (
                    searchResults.map(({ label, icon: Icon, hint }, i) => (
                      <div
                        key={label}
                        onMouseDown={() => goToPage(label)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                        style={{ borderBottom: i < searchResults.length - 1 ? "1px solid rgba(15,23,42,0.04)" : "none" }}
                      >
                        <div
                          className="flex items-center justify-center rounded-lg flex-shrink-0"
                          style={{ width: 28, height: 28, background: "rgba(22,163,74,0.08)" }}
                        >
                          <Icon size={13} style={{ color: "#16A34A" }} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium" style={{ color: "#0F172A" }}>{label}</p>
                          <p className="text-xs text-slate-400 truncate">{hint}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
              {/* Carbon Score Ticker */}
              <CarbonTicker totalCarbon={totalCarbon} loading={scoreLoading} />

              {/* Notifications */}
              <div className="relative" style={{ zIndex: 1001 }}>
                                <button
                  onClick={() => setShowNotif((v) => !v)}
                  className="relative flex items-center justify-center rounded-xl transition-all duration-150"
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
                      className="absolute flex items-center justify-center rounded-full text-white font-bold"
                      style={{
                        width: 16,
                        height: 16,
                        background: "#EF4444",
                        fontSize: 9,
                        top: -4,
                        right: -4,
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
                    }}
                  >
                                        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
                      <span className="font-semibold text-sm" style={{ color: "#0F172A" }}>Notifications</span>
                      <button onClick={() => { setNotifSeenCount(notifItems.length); setShowNotif(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                        <X size={14} />
                      </button>
                    </div>
                                        {notifItems.length === 0 ? (
                      <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
                        <Bell size={18} style={{ color: "#CBD5E1" }} />
                        <p className="text-xs text-slate-400">No notifications yet — log an action to get your first AI tip.</p>
                      </div>
                    ) : (
                      <div style={{ maxHeight: 320, overflowY: "auto" }}>
                        {notifItems.map((n: any, i: number) => {
                          const isAlert = n.kind === "alert";
                          const Icon = isAlert ? n.icon : (CATEGORY_ICON[n.category] || Bell);
                          const color = isAlert ? n.color : (CATEGORY_COLOR[n.category] || "#16A34A");
                          const text = isAlert ? n.text : `${CATEGORY_LABEL[n.category] || "Action"} logged — new AI tip ready`;
                          const time = isAlert ? n.time : timeAgo(n.loggedAt);
                          const isUnread = i < notifications;
                          return (
                            <div
                              key={n.id}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                              style={{
                                borderBottom: i < notifItems.length - 1 ? "1px solid rgba(15,23,42,0.04)" : "none",
                                background: isUnread ? "rgba(22,163,74,0.04)" : "transparent",
                              }}
                            >
                              <div
                                className="flex items-center justify-center rounded-full flex-shrink-0"
                                style={{ width: 30, height: 30, background: `${color}14` }}
                              >
                                <Icon size={13} style={{ color }} strokeWidth={2} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs" style={{ color: "#0F172A", fontWeight: isUnread ? 600 : 400 }}>
                                  {text}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">{time}</p>
                              </div>
                              {isUnread && (
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#16A34A" }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  className="flex items-center justify-center rounded-xl font-semibold text-sm"
                  style={{
                    width: 38,
                    height: 38,
                    background: "linear-gradient(135deg, #16A34A, #4ADE80)",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-semibold" style={{ color: "#0F172A" }}>{displayName || "User"}</div>
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
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex gap-0 h-full">

              {/* CENTER MAIN */}
              <main className="flex-1 px-8 py-7 overflow-y-auto">

                {/* Welcome + page title */}
                <div className="flex items-start justify-between mb-7" style={{ animation: "fadeUp 0.4s ease forwards", opacity: 0 }}>
                  <div>
                    <h1 className="font-bold mb-1" style={{ fontSize: 22, color: "#0F172A", letterSpacing: "-0.025em" }}>
                      Good morning, {displayName?.split(" ")[0] || "there"} 👋
                    </h1>
                    <p className="text-sm" style={{ color: "#64748B" }}>
                      Here&apos;s your sustainability overview for today, {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.
                    </p>
                  </div>
                  <button
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150"
                    style={{
                      background: "#16A34A",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                      letterSpacing: "-0.01em",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#15803D";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(22,163,74,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#16A34A";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(22,163,74,0.3)";
                    }}
                  >
                    <Activity size={14} />
                    Log Activity
                  </button>
                </div>

                {/* Metric cards row */}
                  <div className="grid grid-cols-4 gap-4 mb-7">
                  <MetricCard icon={Globe} label="Total CO₂ Today" value={formatCarbonValue(totalCarbon, unit)} unit={unitLabel(unit)} accent="#16A34A" delay="0.05s" />
                  <MetricCard icon={Car} label="Travel (This Month)" value={formatCarbonValue(categoryTotals.travel, unit)} unit={unitLabel(unit)} accent="#3B82F6" delay="0.1s" />
                  <MetricCard icon={Utensils} label="Food (This Month)" value={formatCarbonValue(categoryTotals.food, unit)} unit={unitLabel(unit)} accent="#F59E0B" delay="0.15s" />
                  <MetricCard icon={Battery} label="Electricity (This Month)" value={formatCarbonValue(categoryTotals.electricity, unit)} unit={unitLabel(unit)} accent="#8B5CF6" delay="0.2s" />
                </div>

                {/* Earth + context section */}
                <div
                  className="rounded-2xl p-6 mb-7 flex items-center gap-8"
                  style={{
                    background: "linear-gradient(135deg, #0F172A 0%, #0a1a2e 50%, #071a0e 100%)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.1)",
                    animation: "fadeUp 0.5s ease forwards",
                    animationDelay: "0.25s",
                    opacity: 0,
                  }}
                >
                  {/* Left: Earth */}
                  <div className="flex-shrink-0">
                    <SpinningGlobe totalCarbon={totalCarbon} />
                  </div>

                  {/* Right: stats */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#4ADE80", boxShadow: "0 0 6px #4ADE80" }} />
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#4ADE80", fontSize: 10 }}>Live Emission Status</span>
                    </div>
                                        <h2 className="font-bold mb-2" style={{ fontSize: 24, color: "#F8FAFC", letterSpacing: "-0.025em" }}>
                      {isLowEmission ? "Low Emission Day" : "High Emission Day"}
                    </h2>
                    <p className="text-sm mb-6" style={{ color: "#64748B", maxWidth: 320, lineHeight: 1.6 }}>
                      {isLowEmission
                        ? `You're ${formatCarbon(kgLeft, unit)} under today's ${formatCarbon(DAILY_TARGET_KG, unit)} target. The Earth visualization reflects your real-time impact — keep it green.`
                        : `You're ${formatCarbon(totalCarbon - DAILY_TARGET_KG, unit)} over today's ${formatCarbon(DAILY_TARGET_KG, unit)} target. The Earth visualization reflects your real-time impact.`}
                    </p>

                                        <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Weekly Total", value: formatCarbon(weekTotal, unit), sub: "so far this week", color: "#4ADE80" },
                        { label: "Monthly Avg", value: formatCarbon(monthlyAvg, unit), sub: "avg over 6 months", color: "#22C55E" },
                        { label: "Annual Pace", value: formatCarbon(monthlyAvg * 12, unit), sub: "projected from avg", color: "#86EFAC" },
                      ].map(({ label, value, sub, color }) => (
                        <div
                          key={label}
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div className="text-xs mb-1" style={{ color: "#475569" }}>{label}</div>
                          <div className="font-bold text-base" style={{ color: "#F8FAFC", letterSpacing: "-0.02em" }}>{value}</div>
                          <div className="text-xs mt-0.5" style={{ color }}>{sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Weekly emissions chart — real Firestore data via LiveBarChart (Week 4 Day 4) */}
                  <div style={{ animation: "fadeUp 0.5s ease forwards", animationDelay: "0.3s", opacity: 0 }}>
                    <LiveBarChart week={week} loading={weekLoading} />
                  </div>

                  {/* Monthly trend */}
                  <div
                    className="chart-card rounded-2xl p-5"
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(15,23,42,0.07)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                      animation: "fadeUp 0.5s ease forwards",
                      animationDelay: "0.35s",
                      opacity: 0,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-sm" style={{ color: "#0F172A", letterSpacing: "-0.01em" }}>Monthly Trend</h3>
                        <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Actual vs target CO₂ (kg)</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "#94A3B8" }}>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: "#16A34A" }} />Actual</div>
                        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 rounded" style={{ background: "#94A3B8", borderTop: "2px dashed #94A3B8" }} />Target</div>
                      </div>
                    </div>
                    {monthlyLoading ? (
                      <div className="flex items-center justify-center" style={{ height: 180 }}>
                        <span className="text-xs" style={{ color: "#94A3B8" }}>Loading…</span>
                      </div>
                    ) : !hasMonthlyData ? (
                      <div className="flex items-center justify-center text-center" style={{ height: 180 }}>
                        <span className="text-xs" style={{ color: "#94A3B8" }}>Log actions over a few months to see this trend.</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={monthly}>
                          <defs>
                            <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[0, "dataMax + 20"]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="co2" name="Actual" stroke="#16A34A" strokeWidth={2} fill="url(#areaGreen)" dot={{ fill: "#16A34A", strokeWidth: 2, r: 4 }} />
                          <Line type="monotone" dataKey="target" name="Target" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Category breakdown */}
                <div
                  className="chart-card rounded-2xl p-5"
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(15,23,42,0.07)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                    animation: "fadeUp 0.5s ease forwards",
                    animationDelay: "0.4s",
                    opacity: 0,
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-semibold text-sm" style={{ color: "#0F172A", letterSpacing: "-0.01em" }}>Emission Sources</h3>
                      <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Distribution by category — this month</p>
                    </div>
                    <button className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors" style={{ color: "#16A34A", background: "rgba(22,163,74,0.08)", border: "none", cursor: "pointer" }}>
                      View report →
                    </button>
                  </div>
                  {totalsLoading ? (
                    <div className="flex items-center justify-center" style={{ height: 120 }}>
                      <span className="text-xs" style={{ color: "#94A3B8" }}>Loading…</span>
                    </div>
                  ) : categoryData.length === 0 ? (
                    <div className="flex items-center justify-center" style={{ height: 120 }}>
                      <span className="text-xs" style={{ color: "#94A3B8" }}>Log an action to see your breakdown here.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-8">
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height={120}>
                          <BarChart data={categoryData} layout="vertical" barSize={10}>
                            <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} width={70} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Share" radius={[0, 4, 4, 0]}>
                              {categoryData.map((entry) => (
                                <Cell key={entry.category} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-3">
                        {categoryData.map(({ category, value, color }) => (
                          <div key={category} className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                            <span className="text-sm" style={{ color: "#64748B", width: 80 }}>{category}</span>
                            <span className="font-semibold text-sm tabular-nums" style={{ color: "#0F172A" }}>{value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </main>

              {/* ─── RIGHT SIDEBAR: AI PANEL ───────────────────────────── */}
              <aside
                className="flex-shrink-0 flex flex-col"
                style={{
                  width: 300,
                  background: "#ffffff",
                  borderLeft: "1px solid rgba(15,23,42,0.07)",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {/* AI panel header */}
                <div
                  className="px-5 pt-6 pb-4 flex-shrink-0"
                  style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div
                      className="flex items-center justify-center rounded-xl"
                      style={{
                        width: 32,
                        height: 32,
                        background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                        boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
                      }}
                    >
                      <Brain size={15} color="white" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "#0F172A", letterSpacing: "-0.01em" }}>Gemini AI Assistant</div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#16A34A" }} />
                        <span className="text-xs" style={{ color: "#64748B" }}>Active & learning</span>
                      </div>
                    </div>
                    <div style={{ marginLeft: 16 }}>
                      <Qbit score={Math.min((totalCarbon / DAILY_TARGET_KG) * 100, 100)} size={32} />
                    </div>
                  </div>
                </div>

                {/* AI insights feed */}
                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                  <TipFeed tips={tips} loading={tipsLoading} />

                  {/* Quick tips */}
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(79,70,229,0.05), rgba(124,58,237,0.03))",
                      border: "1px solid rgba(79,70,229,0.1)",
                      animation: "fadeUp 0.5s ease forwards",
                      animationDelay: "0.5s",
                      opacity: 0,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={13} style={{ color: "#7C3AED" }} />
                      <span className="text-xs font-semibold" style={{ color: "#7C3AED" }}>Quick Wins</span>
                    </div>
                    {[
                      "Turn off standby devices tonight",
                      "Walk instead of drive for <2km trips",
                      "Choose seasonal produce this week",
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                        <CheckCircle2 size={12} style={{ color: "#16A34A", flexShrink: 0, marginTop: 1 }} />
                        <span className="text-xs" style={{ color: "#64748B", lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI input */}
                <div
                  className="px-4 pb-5 pt-3 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(15,23,42,0.06)" }}
                >
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{
                      background: "#F8FAFC",
                      border: "1.5px solid rgba(15,23,42,0.1)",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#16A34A")}
                    onBlur={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(15,23,42,0.1)")}
                  >
                    <Brain size={14} style={{ color: "#94A3B8", flexShrink: 0 }} />
                    <input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
                      placeholder="Ask AI anything..."
                      disabled={aiAsking}
                      style={{
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: 13,
                        color: "#0F172A",
                        flex: 1,
                        fontFamily: "inherit",
                      }}
                    />
                    <button
                      onClick={handleAskAI}
                      disabled={!aiInput || aiAsking}
                      style={{
                        background: aiInput && !aiAsking ? "#16A34A" : "rgba(15,23,42,0.08)",
                        border: "none",
                        cursor: aiInput && !aiAsking ? "pointer" : "default",
                        color: aiInput && !aiAsking ? "white" : "#94A3B8",
                        borderRadius: 8,
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background 0.15s",
                      }}
                    >
                      <SendHorizonal size={13} />
                    </button>
                  </div>
                  {aiAsking && (
                    <p className="text-xs mt-2" style={{ color: "#94A3B8" }}>Thinking…</p>
                  )}
                  {!aiAsking && aiAnswer && (
                    <p className="text-xs mt-2 p-2.5 rounded-lg" style={{ color: "#374151", background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.06)", lineHeight: 1.5 }}>
                      {aiAnswer}
                    </p>
                  )}
                  <p className="text-xs text-center mt-2" style={{ color: "#CBD5E1" }}>Powered by Gemini 3.6 Flash</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}