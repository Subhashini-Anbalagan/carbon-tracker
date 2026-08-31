import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { navRoutes } from "../navRoutes";
import { useAuth } from "../../hooks/useAuth";
import { useLiveScore } from "../../hooks/useLiveScore";
import { useCategoryTotals } from "../../hooks/useCategoryTotals";
import { useMonthStats } from "../../hooks/useMonthStats";
import { useMonthlyTrend } from "../../hooks/useMonthlyTrend";
import { useCityElements } from "../../hooks/useCityElements";
import { TRAVEL_EMISSION_FACTORS } from "../../constants/emissionFactors";
import { generateCarbonReportPDF } from "../../services/reportGenerator";
import { CarbonTicker } from "../components/dashboard/CarbonTicker";
import { Qbit } from "../components/dashboard/Qbit";
import { CityBuilder } from "../components/reports/CityBuilder";
import { EcoCatch } from "../components/reports/EcoCatch";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useProfileName } from "../../hooks/useProfileName";
import { useDailyTarget } from "../../hooks/useDailyTarget";
import { useUnit } from "../../hooks/useUnit";
import { formatCarbon, formatCarbonValue, unitLabel } from "../../utils/formatCarbon";
import { useWeeklyBreakdown } from "../../hooks/useWeeklyBreakdown";
import {
  Leaf, Brain, LayoutDashboard, Activity, BarChart3, FileText, Settings,
  Bell, ChevronDown, TrendingDown, TrendingUp, Target, Award,
  Sparkles, Flame, Car, Utensils, Zap, Download, Share2,
  Mail, Trophy, CheckCircle2, ArrowDownRight, ArrowUpRight,
  Calendar, Globe, Wind, Lock, ChevronRight, Star, Printer,
  ExternalLink, Copy, MoreHorizontal, Eye, Clock, Loader
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

// ─── Data ─────────────────────────────────────────────────


const aiRecs = [
  { icon: Car, color: "#3B82F6", text: "Switch 2 weekly car trips to public transit → save ~10 kg/month" },
  { icon: Utensils, color: "#F59E0B", text: "3 plant-based meals/week could cut food emissions by 18 kg" },
  { icon: Zap, color: "#8B5CF6", text: "Off-peak electricity use (after 9 PM) reduces grid carbon intensity 22%" },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Activity, label: "Activity Logger" },
  { icon: BarChart3, label: "Analytics" },
  { icon: FileText, label: "Reports", active: true },
  { icon: Settings, label: "Settings" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12, padding: "8px 12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)", fontSize: 12,
    }}>
      <div style={{ color: "white", fontWeight: 600, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: p.color }} />
          <span style={{ color: "#94A3B8" }}>{p.name}:</span>
          <span style={{ color: "white", fontWeight: 600 }}>{p.value} kg</span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat Row ─────────────────────────────────────────────────────────────────

const StatRow = ({
  icon: Icon, label, value, color, pct, total,
}: {
  icon: React.ElementType; label: string; value: number; color: string; pct: number; total: number;
}) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={13} style={{ color }} strokeWidth={1.8} />
        </div>
        <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>{value} kg</span>
        <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}10`, borderRadius: 6, padding: "1px 6px" }}>{pct}%</span>
      </div>
    </div>
    <div style={{ height: 4, background: "rgba(15,23,42,0.06)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}aa)`,
        width: `${(value / total) * 100}%`, transition: "width 1s ease",
      }} />
    </div>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Reports() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const displayName = useProfileName(user?.uid, user?.displayName);
  const [activeNav, setActiveNav] = useState("Reports");
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState(2);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [activePie, setActivePie] = useState<number | null>(null);

  // Live carbon score — realtime from Firestore, replaces the old random simulation
  const { totalCarbon, loading: scoreLoading } = useLiveScore(user?.uid);
  const { totals: categoryTotals, loading: totalsLoading } = useCategoryTotals(user?.uid);
  const { stats: monthStats, loading: statsLoading } = useMonthStats(user?.uid);
  const { monthly, loading: monthlyLoading } = useMonthlyTrend(user?.uid);
  const { greenCount, badCount, health: cityHealth, topHabit, weekWeather, loading: cityLoading } = useCityElements(user?.uid);

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const { dailyTarget: DAILY_TARGET } = useDailyTarget(user?.uid);
  const { unit } = useUnit(user?.uid);
  const monthlyTarget = DAILY_TARGET * daysInMonth;
  const { weeks: weeklyBreakdown, loading: weeklyLoading } = useWeeklyBreakdown(user?.uid, DAILY_TARGET);

  const todayFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const categoryPieData = [
    { name: "Travel", value: categoryTotals.travel, color: "#3B82F6" },
    { name: "Food", value: categoryTotals.food, color: "#F59E0B" },
    { name: "Electricity", value: categoryTotals.electricity, color: "#8B5CF6" },
  ].map((d) => ({
    ...d,
    pct: categoryTotals.total > 0 ? Math.round((d.value / categoryTotals.total) * 100) : 0,
  }));

  const sustainabilityScore = monthStats.daysLogged > 0
    ? Math.round((monthStats.daysUnderTarget / monthStats.daysLogged) * 100)
    : 0;
  const grade =
    sustainabilityScore >= 90 ? "A+" :
    sustainabilityScore >= 80 ? "A" :
    sustainabilityScore >= 70 ? "B+" :
    sustainabilityScore >= 60 ? "B" :
    sustainabilityScore >= 50 ? "C" : "D";

  const prevMonth = monthly.length >= 2 ? monthly[monthly.length - 2] : null;
  const monthOverMonthPct = prevMonth && prevMonth.co2 > 0
    ? +(((categoryTotals.total - prevMonth.co2) / prevMonth.co2) * 100).toFixed(1)
    : null;

  const carbonSaved = +(monthlyTarget - categoryTotals.total).toFixed(1);
  const kmFewer = Math.round(Math.abs(carbonSaved) / TRAVEL_EMISSION_FACTORS.car);

  const last3 = monthly.slice(-4, -1);
  const last3Avg = last3.length > 0 ? last3.reduce((s, m) => s + m.co2, 0) / last3.length : null;
  const vs3MonthAvgPct = last3Avg && last3Avg > 0
    ? +(((categoryTotals.total - last3Avg) / last3Avg) * 100).toFixed(1)
    : null;

  const comparisonRows = [
    monthOverMonthPct !== null && prevMonth && {
      label: `vs ${prevMonth.month}`,
      pct: monthOverMonthPct,
      val: `${categoryTotals.total - prevMonth.co2 >= 0 ? "+" : "−"}${Math.abs(+(categoryTotals.total - prevMonth.co2).toFixed(1))} kg`,
    },
    vs3MonthAvgPct !== null && {
      label: "vs 3-month avg",
      pct: vs3MonthAvgPct,
      val: `${categoryTotals.total - (last3Avg ?? 0) >= 0 ? "+" : "−"}${Math.abs(+(categoryTotals.total - (last3Avg ?? 0)).toFixed(1))} kg`,
    },
  ].filter(Boolean);

  const achievements = [
    {
      id: 1, icon: Activity, label: "Consistent Tracker",
      desc: `Logged activity on ${monthStats.daysLogged} of ${daysInMonth} days this month`,
      color: "#F59E0B", bg: "rgba(245,158,11,0.1)",
      unlocked: monthStats.daysLogged >= 20,
    },
    {
      id: 2, icon: Leaf, label: "Carbon Saver",
      desc: monthOverMonthPct !== null
        ? `${monthOverMonthPct <= 0 ? "Cut" : "Changed"} emissions ${Math.abs(monthOverMonthPct)}% vs last month`
        : "Cut emissions 10%+ vs last month",
      color: "#16A34A", bg: "rgba(22,163,74,0.1)",
      unlocked: monthOverMonthPct !== null && monthOverMonthPct <= -10,
    },
    {
      id: 3, icon: Award, label: "On Target",
      desc: `Sustainability score of ${sustainabilityScore}/100 this month`,
      color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",
      unlocked: sustainabilityScore >= 70,
    },
    {
      id: 4, icon: Star, label: "Best Day",
      desc: monthStats.bestDay
        ? `Logged ${monthStats.bestDay.total} kg on your lowest day — under your ${DAILY_TARGET} kg target`
        : `Log a day under your ${DAILY_TARGET} kg target`,
      color: "#EC4899", bg: "rgba(236,72,153,0.1)",
      unlocked: !!monthStats.bestDay && monthStats.bestDay.total <= DAILY_TARGET,
    },
  ];

  const pastReports = monthly
    .slice(0, -1)
    .map((m, i, arr) => {
      const prev = i > 0 ? arr[i - 1] : null;
      const change = prev && prev.co2 > 0 ? +(((m.co2 - prev.co2) / prev.co2) * 100).toFixed(1) : null;
      return { month: m.month, co2: m.co2, change };
    })
    .reverse();

  const reportShareUrl = user?.uid && typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}#/shared/${user.uid}`
    : "";
  const displayShareUrl = reportShareUrl.replace(/^https?:\/\//, "");

  const buildReportSummaryText = () =>
    `EcoTrack AI — ${monthLabel} Report\n` +
    `Total CO₂: ${formatCarbon(categoryTotals.total, unit)}\n` +
    `Travel: ${formatCarbon(categoryTotals.travel, unit)} | Food: ${formatCarbon(categoryTotals.food, unit)} | Electricity: ${formatCarbon(categoryTotals.electricity, unit)}\n` +
    `Sustainability Score: ${sustainabilityScore}/100 (${grade})`;

  // Keep a public, aggregated-only snapshot in sync so the share link works without login
  useEffect(() => {
    if (!user?.uid || totalsLoading || statsLoading) return;
    setDoc(
      doc(db, "sharedReports", user.uid),
      {
        displayName: user.displayName || "EcoTrack user",
        monthLabel,
        total: categoryTotals.total,
        travel: categoryTotals.travel,
        food: categoryTotals.food,
        electricity: categoryTotals.electricity,
        sustainabilityScore,
        grade,
        carbonSaved,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch((err) => console.error("Shared report sync failed:", err));
  }, [user?.uid, totalsLoading, statsLoading, categoryTotals.total, categoryTotals.travel, categoryTotals.food, categoryTotals.electricity, sustainabilityScore, grade, carbonSaved, monthLabel]);

  const handleDownload = async () => {
    setDownloading(true);
    const fileName = `EcoTrack-Report-${monthLabel.replace(" ", "-")}.pdf`;
    try {
      await generateCarbonReportPDF("report-preview", fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed — check the browser console for details.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard write failed:", err);
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(`${buildReportSummaryText()}\n\nView it here: ${reportShareUrl}`);
      setSummaryCopied(true);
      setTimeout(() => setSummaryCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard write failed:", err);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["Category", `CO2 (${unitLabel(unit)})`],
      ["Travel", formatCarbonValue(categoryTotals.travel, unit)],
      ["Food", formatCarbonValue(categoryTotals.food, unit)],
      ["Electricity", formatCarbonValue(categoryTotals.electricity, unit)],
      ["Total", formatCarbonValue(categoryTotals.total, unit)],
      [],
      ["Sustainability Score", `${sustainabilityScore}/100 (${grade})`],
      [`Carbon Saved This Month (${unitLabel(unit)})`, formatCarbonValue(carbonSaved, unit)],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EcoTrack-Report-${monthLabel.replace(" ", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareData = { title: "EcoTrack AI Report", text: buildReportSummaryText(), url: reportShareUrl };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled the share sheet — no-op
      }
    } else {
      handleCopySummary();
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
        @keyframes spinLoader { to { transform: rotate(360deg); } }
        .notif-dot { width: 5px; height: 5px; background: #EF4444; border-radius: 50%; animation: tickerBlink 2s ease-in-out infinite; }
        .nav-btn { transition: background 0.12s; border: none; background: transparent; cursor: pointer; }
        .nav-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .action-btn {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 14px; border: none;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.18s ease;
        }
        .action-btn:hover { transform: translateY(-1px); }
        .card { transition: box-shadow 0.2s ease; }
        .card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.08) !important; }
        .achievement-card { transition: all 0.15s ease; border-radius: 14px; padding: 12px; cursor: pointer; }
        .achievement-card:hover { background: #F8FAFC; }
        .report-section { animation: fadeUp 0.5s ease forwards; opacity: 0; }
        .loader { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spinLoader 0.6s linear infinite; }
        @media print {
          aside, header { display: none !important; }
          #report-scroll-container { display: block !important; padding: 0 !important; }
          #report-scroll-container > div:first-child,
          #report-scroll-container > div:last-child { display: none !important; }
          #report-preview { width: 100% !important; }
        }
      `}</style>

      <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", background: "#F8FAFC" }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside style={{ width: 240, background: "#0F172A", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "28px 24px 32px" }}>
            <div className="rounded-xl" style={{ width: 36, height: 36, background: "linear-gradient(135deg, #16A34A, #4ADE80)", boxShadow: "0 4px 12px rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Leaf size={18} color="white" strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.01em" }}>EcoTrack AI</div>
              <div style={{ color: "#4ADE80", letterSpacing: "0.06em", fontSize: 10, fontWeight: 600 }}>CARBON INTELLIGENCE</div>
            </div>
          </div>

          <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 600, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Main Menu
          </div>

          <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map(({ icon: Icon, label }) => {
              const isActive = activeNav === label;
              return (
                <button key={label} onClick={() => {
                    setActiveNav(label);
                    if (navRoutes[label] && navRoutes[label] !== "/reports") {
                      navigate(navRoutes[label]);
                    }
                  }}
                  className="nav-btn"
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, textAlign: "left", width: "100%", background: isActive ? "rgba(22,163,74,0.12)" : "transparent" }}>
                  <Icon size={17} strokeWidth={isActive ? 2 : 1.7}
                    style={{ color: isActive ? "#4ADE80" : "#475569", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: isActive ? "#F8FAFC" : "#64748B" }}>{label}</span>
                  {isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 3, background: "#4ADE80" }} />}
                </button>
              );
            })}
          </nav>

          {/* Sidebar report info */}
          <div style={{ padding: "0 16px 24px" }}>
            <div style={{ borderRadius: 16, padding: 16, background: "linear-gradient(135deg, rgba(22,163,74,0.12), rgba(74,222,128,0.06))", border: "1px solid rgba(74,222,128,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <FileText size={13} style={{ color: "#4ADE80" }} strokeWidth={2} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80" }}>{monthLabel} Report</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
                Updated {todayFormatted}
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                <div style={{ flex: 1, padding: "4px 0", background: "rgba(255,255,255,0.04)", borderRadius: 8, textAlign: "center", fontSize: 10, color: "#94A3B8" }}>PDF</div>
                <div style={{ flex: 1, padding: "4px 0", background: "rgba(255,255,255,0.04)", borderRadius: 8, textAlign: "center", fontSize: 10, color: "#94A3B8" }}>CSV</div>
                <div style={{ flex: 1, padding: "4px 0", background: "rgba(255,255,255,0.04)", borderRadius: 8, textAlign: "center", fontSize: 10, color: "#94A3B8" }}>JSON</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN AREA ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* NAVBAR */}
          <header
  style={{
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    background: "rgba(248,250,252,0.9)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(15,23,42,0.07)",
    flexShrink: 0,
    position: "relative",
    zIndex: 1000,
  }}
>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>Sustainability Reports</h1>
              <p style={{ fontSize: 12, color: "#94A3B8" }}>{monthLabel} · Monthly summary & insights</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <CarbonTicker totalCarbon={totalCarbon} loading={scoreLoading} />
              <div style={{ position: "relative", zIndex: 1001 }}>
  <button
    onClick={() => setShowNotif((v) => !v)}
    style={{
      width: 38,
      height: 38,
      borderRadius: 12,
      background: showNotif ? "rgba(22,163,74,0.08)" : "#ffffff",
      border: "1px solid rgba(15,23,42,0.08)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      position: "relative",
    }}
  >
    <Bell size={16} style={{ color: "#64748B" }} strokeWidth={1.8} />
    {notifications > 0 && (
      <span style={{
        position: "absolute",
        width: 14,
        height: 14,
        background: "#EF4444",
        borderRadius: 7,
        fontSize: 8,
        fontWeight: 700,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        top: -3,
        right: -3,
        border: "2px solid #F8FAFC",
      }}>
        {notifications}
      </span>
    )}
  </button>

  {showNotif && (
    <div style={{
      position: "absolute",
      right: 0,
      top: 48,
      width: 300,
      background: "#ffffff",
      border: "1px solid rgba(15,23,42,0.08)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      zIndex: 1002,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Notifications</span>
        <button
          onClick={() => {
            setNotifications(0);
            setShowNotif(false);
          }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
        >
         x
        </button>
      </div>

      {[
        { text: "Monthly report generated successfully", time: "Just now", dot: "#16A34A" },
        { text: "PDF export is ready to download", time: "5m", dot: "#3B82F6" },
      ].map((n, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "12px 16px",
            cursor: "pointer",
            borderBottom: i < 1 ? "1px solid rgba(15,23,42,0.04)" : "none",
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 4, background: n.dot, flexShrink: 0, marginTop: 6 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>{n.text}</p>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>{n.time} ago</p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, #16A34A, #4ADE80)", color: "white", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(22,163,74,0.25)" }}>{displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}</div>
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
          <div id="report-scroll-container" style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", gap: 20 }}>

            {/* ── LEFT COLUMN: Summary ────────────────────────────────── */}
            <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Score card */}
              <div className="report-section" style={{
                animationDelay: "0.05s", borderRadius: 20,
                background: "linear-gradient(145deg, #0F172A 0%, #0a1a2e 50%, #071a0e 100%)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.15)",
                padding: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: "#4ADE80", boxShadow: "0 0 6px #4ADE80" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80", textTransform: "uppercase", letterSpacing: "0.08em" }}>{monthLabel} Summary</span>
                </div>

                {/* Total */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Total CO₂ Generated</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.04em", lineHeight: 1 }}>{totalsLoading ? "…" : formatCarbonValue(categoryTotals.total, unit)}</span>
                    <span style={{ fontSize: 14, color: "#64748B" }}>{unitLabel(unit)} CO₂</span>
                  </div>
                  {monthOverMonthPct !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      {monthOverMonthPct <= 0
                        ? <ArrowDownRight size={12} style={{ color: "#4ADE80" }} />
                        : <ArrowUpRight size={12} style={{ color: "#EF4444" }} />}
                      <span style={{ fontSize: 11, color: monthOverMonthPct <= 0 ? "#4ADE80" : "#EF4444", fontWeight: 600 }}>
                        {monthOverMonthPct > 0 ? "+" : ""}{monthOverMonthPct}% vs {prevMonth.month}
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 16 }} />

                {/* Category rows */}
                {[
                  { icon: Car, label: "Travel", value: categoryTotals.travel, color: "#3B82F6" },
                  { icon: Utensils, label: "Food", value: categoryTotals.food, color: "#F59E0B" },
                  { icon: Zap, label: "Electricity", value: categoryTotals.electricity, color: "#8B5CF6" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={13} style={{ color }} strokeWidth={1.8} />
                    </div>
                    <span style={{ fontSize: 12, color: "#64748B", flex: 1 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em" }}>{formatCarbon(value, unit)}</span>
                  </div>
                ))}

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0 16px" }} />

                {/* Sustainability score */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#475569" }}>Sustainability Score</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#4ADE80", letterSpacing: "-0.03em" }}>{statsLoading ? "…" : sustainabilityScore} / 100</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${sustainabilityScore}%`, background: "linear-gradient(90deg, #16A34A, #4ADE80)", borderRadius: 3, boxShadow: "0 0 8px rgba(74,222,128,0.4)" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    {["A+", "A", "B+", "B", "C", "D"].map((g) => (
                      <span key={g} style={{ fontSize: 10, fontWeight: g === grade ? 700 : 500, color: g === grade ? "#4ADE80" : "#334155", background: g === grade ? "rgba(74,222,128,0.15)" : "transparent", borderRadius: 4, padding: "1px 4px" }}>{g}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comparison card */}
              <div className="card report-section" style={{
                animationDelay: "0.12s", borderRadius: 20, padding: 18,
                background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 14 }}>Month over Month</h3>
                {comparisonRows.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#94A3B8" }}>Not enough history yet — check back after next month.</p>
                ) : comparisonRows.map(({ label, pct, val }) => {
                  const isGood = pct <= 0;
                  const color = isGood ? "#16A34A" : "#EF4444";
                  return (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(15,23,42,0.05)" }}>
                      <span style={{ fontSize: 12, color: "#64748B" }}>{label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color }}>
                        {isGood ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                        {val}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Carbon saved */}
              <div className="card report-section" style={{
                animationDelay: "0.18s", borderRadius: 20, padding: 18,
                background: "linear-gradient(135deg, rgba(22,163,74,0.06), rgba(74,222,128,0.03))",
                border: "1px solid rgba(22,163,74,0.15)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <TrendingDown size={15} style={{ color: "#16A34A" }} strokeWidth={2} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: carbonSaved >= 0 ? "#16A34A" : "#EF4444" }}>{carbonSaved >= 0 ? "Carbon Saved This Month" : "Over Budget This Month"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.04em", lineHeight: 1 }}>{formatCarbonValue(Math.abs(carbonSaved), unit)}</span>
                  <span style={{ fontSize: 13, color: "#64748B" }}>{unitLabel(unit)} CO₂</span>
                </div>
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 6, lineHeight: 1.5 }}>
                  {carbonSaved >= 0
                    ? <>Equivalent to driving <strong style={{ color: "#16A34A" }}>{kmFewer} km</strong> fewer than your monthly budget.</>
                    : <>That's <strong style={{ color: "#EF4444" }}>{kmFewer} km</strong> worth of driving over your monthly budget.</>}
                </p>
              </div>

              {/* Carbon City Builder */}
              <CityBuilder greenCount={greenCount} badCount={badCount} health={cityHealth} topHabit={topHabit} weekWeather={weekWeather} loading={cityLoading} />
            </div>

            {/* ── CENTER COLUMN: Report Preview ───────────────────────── */}
            <div id="report-preview" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0, background: "#F8FAFC" }}>

              {/* Report header */}
              <div className="card report-section" style={{
                animationDelay: "0.08s", borderRadius: 20, padding: 24,
                background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #16A34A, #4ADE80)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(74,222,128,0.3)" }}>
                        <Leaf size={20} color="white" strokeWidth={2} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.025em" }}>EcoTrack Monthly Report</h2>
                        <p style={{ fontSize: 12, color: "#94A3B8" }}>{displayName || "User"} · {monthLabel} · Generated {todayFormatted}</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.15)" }}>
                      <CheckCircle2 size={12} style={{ color: "#16A34A" }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A" }}>Verified</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.08)" }}>
                      <Lock size={11} style={{ color: "#64748B" }} />
                      <span style={{ fontSize: 11, color: "#64748B" }}>Private</span>
                    </div>
                    <button style={{ width: 32, height: 32, borderRadius: 8, background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MoreHorizontal size={15} style={{ color: "#64748B" }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 6-month trend */}
              <div className="card report-section" style={{
                animationDelay: "0.14s", borderRadius: 20, padding: 20,
                background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em" }}>6-Month Emission Trajectory</h3>
                    <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Monthly CO₂ vs reduction target</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {[{ label: "Actual", color: "#16A34A" }, { label: "Target", color: "#94A3B8" }].map(({ label, color }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 16, height: 2, borderRadius: 1, background: color }} />
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="repGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="co2" name="Actual" stroke="#16A34A" strokeWidth={2.5}
                      fill="url(#repGreen)" dot={{ fill: "#16A34A", r: 4, strokeWidth: 2, stroke: "white" }}
                      activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="target" name="Target" stroke="#94A3B8"
                      strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly breakdown + Pie */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {/* Weekly bar */}
                <div className="card report-section" style={{
                  animationDelay: "0.2s", borderRadius: 20, padding: 20,
                  background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 4 }}>Weekly Breakdown</h3>
                  <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 14 }}>{monthLabel} · {weeklyLoading ? "…" : `${weeklyBreakdown.length} weeks`}</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={weeklyBreakdown} barSize={20} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="co2" name="CO₂" fill="#16A34A" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="target" name="Target" fill="rgba(15,23,42,0.06)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Source pie */}
                <div className="card report-section" style={{
                  animationDelay: "0.25s", borderRadius: 20, padding: 20,
                  background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 4 }}>Source Distribution</h3>
                  <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 8 }}>By category · {monthLabel}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Pie without children — use label prop for center */}
                    <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryPieData}
                            cx="50%" cy="50%"
                            innerRadius={42} outerRadius={60}
                            paddingAngle={3}
                            dataKey="value"
                            onMouseEnter={(_, i) => setActivePie(i)}
                            onMouseLeave={() => setActivePie(null)}
                            isAnimationActive={true}
                          >
                            {categoryPieData.map((entry, i) => (
                              <Cell
                                key={`cell-${i}`}
                                fill={entry.color}
                                opacity={activePie === null || activePie === i ? 1 : 0.35}
                                stroke="none"
                              />
                            ))}
                          </Pie>
                          <Tooltip content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0];
                            return (
                              <div style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 10px", fontSize: 11 }}>
                                <div style={{ color: "white", fontWeight: 600 }}>{d.name}</div>
                                <div style={{ color: "#94A3B8" }}>{d.value} kg · {(d.payload as any).pct}%</div>
                              </div>
                            );
                          }} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center label via absolute overlay */}
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.04em", lineHeight: 1 }}>{totalsLoading ? "…" : Math.round(categoryTotals.total)}</span>
                        <span style={{ fontSize: 9, color: "#94A3B8", marginTop: 2 }}>kg CO₂</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                      {categoryPieData.map((d, i) => (
                        <div key={`legend-${d.name}`}
                          style={{ display: "flex", alignItems: "center", gap: 6, opacity: activePie !== null && activePie !== i ? 0.4 : 1, transition: "opacity 0.15s", cursor: "pointer" }}
                          onMouseEnter={() => setActivePie(i)}
                          onMouseLeave={() => setActivePie(null)}>
                          <div style={{ width: 8, height: 8, borderRadius: 4, background: d.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: "#64748B", flex: 1 }}>{d.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{d.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recs */}
              <div className="card report-section" style={{
                animationDelay: "0.3s", borderRadius: 20, padding: 20,
                background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Brain size={15} color="white" strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>AI Recommendations</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>Powered by Gemini 3.6 Flash · Based on {monthLabel} data</div>
                  </div>
                  <Sparkles size={13} style={{ color: "#7C3AED", marginLeft: "auto" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {aiRecs.map(({ icon: Icon, color, text }, i) => (
                    <div key={i} style={{ padding: 14, borderRadius: 14, background: `${color}06`, border: `1px solid ${color}15` }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                        <Icon size={13} style={{ color }} strokeWidth={2} />
                      </div>
                      <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.55 }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eco Catch game */}
              <EcoCatch />
            </div>

            {/* ── RIGHT COLUMN: Actions & Achievements ────────────────── */}
            <div style={{ width: 256, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Export actions */}
              <div className="card report-section" style={{
                animationDelay: "0.1s", borderRadius: 20, padding: 20,
                background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 14 }}>Export & Share</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="action-btn" onClick={handleDownload}
                    style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", color: "white", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
                    {downloading ? <div className="loader" /> : <Download size={15} />}
                    {downloading ? "Generating PDF..." : "Download PDF"}
                  </button>
                  <button className="action-btn" onClick={handleExportCSV}
                    style={{ background: "#F8FAFC", color: "#0F172A", border: "1.5px solid rgba(15,23,42,0.1)" }}>
                    <FileText size={15} style={{ color: "#16A34A" }} />
                    Export as CSV
                  </button>
                  <button className="action-btn" onClick={handleShare}
                    style={{ background: "#F8FAFC", color: "#0F172A", border: "1.5px solid rgba(15,23,42,0.1)" }}>
                    <Share2 size={15} style={{ color: "#3B82F6" }} />
                    Share Report
                  </button>
                  <button className="action-btn" onClick={handleCopySummary}
                    style={{ background: "#F8FAFC", color: "#0F172A", border: "1.5px solid rgba(15,23,42,0.1)" }}>
                    {summaryCopied ? <CheckCircle2 size={15} style={{ color: "#16A34A" }} /> : <Copy size={15} style={{ color: "#8B5CF6" }} />}
                    {summaryCopied ? "Copied!" : "Copy Summary"}
                  </button>
                  <button className="action-btn" onClick={handlePrint}
                    style={{ background: "#F8FAFC", color: "#0F172A", border: "1.5px solid rgba(15,23,42,0.1)" }}>
                    <Printer size={15} style={{ color: "#64748B" }} />
                    Print Report
                  </button>
                </div>

                {/* Share link */}
                <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 12, background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.08)" }}>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 4 }}>Link to this report</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#64748B", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {displayShareUrl}
                    </span>
                    <button onClick={handleCopy}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: copied ? "#16A34A" : "#94A3B8" }}>
                      {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    </button>
                    <button onClick={() => window.open(reportShareUrl, "_blank")}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8" }}>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="card report-section" style={{
                animationDelay: "0.18s", borderRadius: 20, padding: 20,
                background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em" }}>Achievements</h3>
                  <span style={{ fontSize: 11, color: "#64748B" }}>{achievements.filter((a) => a.unlocked).length} / {achievements.length} unlocked</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {achievements.map(({ id, icon: Icon, label, desc, color, bg, unlocked }) => (
                    <div key={id} className="achievement-card"
                      style={{ opacity: unlocked ? 1 : 0.45, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: unlocked ? bg : "rgba(15,23,42,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: unlocked ? `1px solid ${color}20` : "1px solid rgba(15,23,42,0.06)" }}>
                        <Icon size={17} style={{ color: unlocked ? color : "#94A3B8" }} strokeWidth={1.8} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: unlocked ? "#0F172A" : "#94A3B8" }}>{label}</div>
                        <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.4 }}>{desc}</div>
                      </div>
                      {unlocked
                        ? <CheckCircle2 size={14} style={{ color: "#16A34A", flexShrink: 0 }} />
                        : <Lock size={12} style={{ color: "#CBD5E1", flexShrink: 0 }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Qbit assistant */}
              <div className="card report-section" style={{
                animationDelay: "0.22s", borderRadius: 20, padding: 18,
                background: "linear-gradient(145deg, #F8FAFC, #F1F5F9)",
                border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <Qbit score={Math.min(100, (totalCarbon / DAILY_TARGET) * 100)} size={52} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Qbit</div>
                  <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4, marginTop: 2 }}>
                    {totalCarbon <= DAILY_TARGET
                      ? "You're on track today — nice work."
                      : "A bit over target today — small swaps help."}
                  </p>
                </div>
              </div>

              {/* Report history */}
              <div className="card report-section" style={{
                animationDelay: "0.25s", borderRadius: 20, padding: 20,
                background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 14 }}>Past Reports</h3>
                {pastReports.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#94A3B8" }}>No past reports yet — check back after this month.</p>
                ) : pastReports.map(({ month, co2, change }) => (
                  <div key={month} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(15,23,42,0.05)", cursor: "pointer", transition: "opacity 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Calendar size={13} style={{ color: "#64748B" }} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{month}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8" }}>{co2} kg CO₂</div>
                    </div>
                    {change !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, fontWeight: 700, color: change < 0 ? "#16A34A" : "#EF4444" }}>
                        {change < 0 ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
                        {Math.abs(change)}%
                      </div>
                    )}
                    <ChevronRight size={13} style={{ color: "#CBD5E1" }} />
                  </div>
                ))}
                <button style={{ width: "100%", marginTop: 12, padding: "8px", borderRadius: 10, background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.07)", cursor: "pointer", fontSize: 12, color: "#64748B", fontFamily: "inherit", fontWeight: 500 }}>
                  View all reports →
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
