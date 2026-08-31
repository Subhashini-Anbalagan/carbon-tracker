import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { navRoutes } from "../navRoutes";
import { useAuth } from "../../hooks/useAuth";
import { useProfileName } from "../../hooks/useProfileName";
import { useDailyTarget } from "../../hooks/useDailyTarget";
import { useUnit } from "../../hooks/useUnit";
import { formatCarbon, formatCarbonValue, unitLabel } from "../../utils/formatCarbon";
import { useActions } from "../../hooks/useActions";
import { useLiveScore } from "../../hooks/useLiveScore";
import { useRecentActions } from "../../hooks/useRecentActions";
import { useMonthStats } from "../../hooks/useMonthStats";
import { CarbonTicker } from "../components/dashboard/CarbonTicker";
import { calculateCarbon } from "../../services/carbonEngine";
import TravelForm, { transportModes } from "../components/logger/TravelForm";
import FoodForm, { mealTypes } from "../components/logger/FoodForm";
import ElectricityForm, { applianceOptions } from "../components/logger/ElectricityForm";
import {
  Leaf, Brain, TrendingUp, Zap, Car, Utensils, Battery,
  LayoutDashboard, Activity, BarChart3, FileText, Settings,
  Bell, Search, ChevronDown, ArrowDownRight, ArrowUpRight,
  Plane, Bus, Bike, Calendar, CheckCircle2, Sparkles,
  Clock, Plus, X, ChevronRight, Flame, Droplets,
  ShoppingBag, Home, Wind, Target, Circle, SendHorizonal,
  Train, Beef, Salad, Coffee, Apple, Wheat,
  AlertCircle
} from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "travel" | "food" | "electricity";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: false },
  { icon: Activity, label: "Activity Logger", active: true },
  { icon: BarChart3, label: "Analytics", active: false },
  { icon: FileText, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toFixed(2);

const getDeltaColor = (d: string) =>
  d === "high" ? "#EF4444" : d === "medium" ? "#F59E0B" : "#16A34A";

const getDeltaBg = (d: string) =>
  d === "high" ? "rgba(239,68,68,0.08)" : d === "medium" ? "rgba(245,158,11,0.08)" : "rgba(22,163,74,0.08)";

// ─── Progress Ring ────────────────────────────────────────────────────────────

const ProgressRing = ({ value, max, color }: { value: number; max: number; color: string }) => {
  const pct = Math.min((value / max) * 100, 100);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  return (
    <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth={10} />
      <circle
        cx={65} cy={65} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${color}60)` }}
      />
    </svg>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function ActivityLogger() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { addAction } = useActions();
  const displayName = useProfileName(user?.uid, user?.displayName);
  const [activeTab, setActiveTab] = useState<Tab>("travel");
  const [activeNav, setActiveNav] = useState("Activity Logger");

  // Travel state
  const [transport, setTransport] = useState(transportModes[0]);
  const [distance, setDistance] = useState("");
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split("T")[0]);
  const [transportOpen, setTransportOpen] = useState(false);

  // Food state
  const [meal, setMeal] = useState(mealTypes[0]);
  const [quantity, setQuantity] = useState("1");
  const [mealOpen, setMealOpen] = useState(false);

  // Electricity state
  const [appliance, setAppliance] = useState(applianceOptions[0]);
  const [hoursUsed, setHoursUsed] = useState("");
  const [elecDate, setElecDate] = useState(new Date().toISOString().split("T")[0]);

  // Live CO2 preview
  const [preview, setPreview] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { activities } = useRecentActions(user?.uid);
  const { dailyTarget: DAILY_TARGET } = useDailyTarget(user?.uid);
  const { unit } = useUnit(user?.uid);

  // Live carbon score — realtime from Firestore, replaces the old random simulation
  const { totalCarbon, breakdown: todayBreakdown, loading: scoreLoading } = useLiveScore(user?.uid);
  const { stats: monthStats } = useMonthStats(user?.uid);

  const sustainabilityScore = monthStats.daysLogged > 0
    ? Math.round((monthStats.daysUnderTarget / monthStats.daysLogged) * 100)
    : 0;
  const grade =
    sustainabilityScore >= 90 ? "A+" :
    sustainabilityScore >= 80 ? "A" :
    sustainabilityScore >= 70 ? "B+" :
    sustainabilityScore >= 60 ? "B" :
    sustainabilityScore >= 50 ? "C" : "D";
  const [showNotif, setShowNotif] = useState(false);
  const [notifSeenCount, setNotifSeenCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setSearchQuery("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Recalculate preview
  useEffect(() => {
    if (activeTab === "travel") {
      const d = parseFloat(distance) || 0;
      setPreview(+(d * transport.co2PerKm).toFixed(3));
    } else if (activeTab === "food") {
      const q = parseFloat(quantity) || 1;
      setPreview(+(q * meal.co2PerServing).toFixed(3));
    } else {
      const h = parseFloat(hoursUsed) || 0;
      const kwh = (h * appliance.watts) / 1000;
      setPreview(+(kwh * 0.82).toFixed(3));
    }
  }, [activeTab, transport, distance, meal, quantity, hoursUsed, appliance]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (preview <= 0) return;

    // Work out sub-type + raw value for the active tab, then get the real CO2 figure
    const subType = activeTab === "travel" ? transport.id : activeTab === "food" ? meal.id : appliance.id;
    const computedKwh = ((parseFloat(hoursUsed) || 0) * appliance.watts) / 1000;
    const rawValue = activeTab === "travel" ? distance : activeTab === "food" ? quantity : String(computedKwh);
    const carbonKg = calculateCarbon(activeTab, subType, rawValue);

    // Save this action permanently to Firestore: users/{uid}/actions/{id}
    // — useRecentActions picks it up automatically via onSnapshot, no local state to update
    if (user) {
      await addAction(user.uid, activeTab, subType, parseFloat(rawValue) || 0, carbonKg);
    }

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2200);
    setDistance("");
    setHoursUsed("");
    setQuantity("1");
    setPreview(0);
  };

  const pct = Math.min((totalCarbon / DAILY_TARGET) * 100, 100);
  const ringColor = pct < 50 ? "#16A34A" : pct < 80 ? "#F59E0B" : "#EF4444";

  // Real notification alerts — derived from the live score already computed above
  const notifAlerts: { id: string; text: string; time: string; dot: string }[] = [];
  if (submitted) {
    notifAlerts.push({ id: "n-logged", text: "Activity logged successfully", time: "Just now", dot: "#16A34A" });
  }
  if (!scoreLoading && totalCarbon > DAILY_TARGET) {
    notifAlerts.push({ id: "n-over", text: `Daily target exceeded by ${formatCarbon(totalCarbon - DAILY_TARGET, unit)}`, time: "Today", dot: "#EF4444" });
  } else if (!scoreLoading && pct >= 80) {
    notifAlerts.push({ id: "n-close", text: `${Math.round(pct)}% of today's ${formatCarbon(DAILY_TARGET, unit)} target used`, time: "Today", dot: "#F59E0B" });
  } else if (!scoreLoading && totalCarbon > 0) {
    notifAlerts.push({ id: "n-ontrack", text: `On track — ${formatCarbon(Math.max(0, DAILY_TARGET - totalCarbon), unit)} left today`, time: "Today", dot: "#16A34A" });
  }
  const notifications = Math.max(0, notifAlerts.length - notifSeenCount);

  // Real search — filters the Recent Activities list by label/sub as you type
  const filteredActivities = searchQuery.trim()
    ? activities.filter((a) =>
        a.label.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        a.sub.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : activities;

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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes successPop {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmerPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes tickerBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .field-input {
          width: 100%;
          padding: 11px 14px;
          background: #F8FAFC;
          border: 1.5px solid rgba(15,23,42,0.09);
          border-radius: 12px;
          font-size: 14px;
          color: #0F172A;
          outline: none;
          transition: all 0.18s ease;
          font-family: 'Inter', sans-serif;
        }
        .field-input::placeholder { color: #94A3B8; }
        .field-input:focus {
          border-color: #16A34A;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.1);
        }
        .field-input[type="date"] { color-scheme: light; }
        .tab-btn {
          flex: 1;
          padding: 9px 12px;
          border: none;
          background: transparent;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .tab-active {
          background: #ffffff;
          color: #0F172A;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
        }
        .tab-inactive { color: #64748B; }
        .tab-inactive:hover { color: #0F172A; background: rgba(255,255,255,0.5); }
        .mode-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          border-radius: 14px;
          border: 1.5px solid rgba(15,23,42,0.07);
          background: #ffffff;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
          flex: 1;
        }
        .mode-card:hover { border-color: rgba(22,163,74,0.3); background: rgba(22,163,74,0.02); }
        .mode-card.selected { border-color: #16A34A; background: rgba(22,163,74,0.04); box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
        .submit-btn {
          width: 100%;
          padding: 13px 20px;
          background: linear-gradient(135deg, #16A34A, #15803D);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: -0.01em;
        }
        .submit-btn:hover {
          background: linear-gradient(135deg, #15803D, #14532D);
          box-shadow: 0 6px 20px rgba(22,163,74,0.35);
          transform: translateY(-1px);
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .submit-btn.success { background: linear-gradient(135deg, #16A34A, #4ADE80); }
        .nav-item { transition: background 0.12s; }
        .nav-item:hover { background: rgba(255,255,255,0.06) !important; }
        .activity-row { transition: background 0.15s; }
        .activity-row:hover { background: #F8FAFC !important; }
        .notif-dot { width: 5px; height: 5px; background: #EF4444; border-radius: 50%; animation: tickerBlink 2s ease-in-out infinite; }
        .dropdown-enter { animation: scaleIn 0.15s ease forwards; }
      `}</style>

      <div className="flex w-screen h-screen overflow-hidden" style={{ background: "#F8FAFC" }}>

        {/* ─── LEFT SIDEBAR ───────────────────────────────────────────────── */}
        <aside className="flex flex-col h-full flex-shrink-0"
          style={{ width: 240, background: "#0F172A", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3 px-6 pt-7 pb-8">
            <div className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 36, height: 36, background: "linear-gradient(135deg, #16A34A, #4ADE80)", boxShadow: "0 4px 12px rgba(74,222,128,0.3)" }}>
              <Leaf size={18} color="white" strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-bold text-sm text-white" style={{ letterSpacing: "-0.01em" }}>EcoTrack AI</div>
              <div className="text-xs font-medium" style={{ color: "#4ADE80", letterSpacing: "0.06em", fontSize: 10 }}>CARBON INTELLIGENCE</div>
            </div>
          </div>

          <div className="px-5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#334155", fontSize: 10 }}>Main Menu</span>
          </div>

          <nav className="flex-1 px-3 flex flex-col gap-0.5">
            {navItems.map(({ icon: Icon, label }) => {
              const isActive = activeNav === label;
              return (
                <button key={label} onClick={() => {
                    setActiveNav(label);
                    if (navRoutes[label] && navRoutes[label] !== "/activity") {
                      navigate(navRoutes[label]);
                    }
                  }}
                  className="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-left w-full"
                  style={{ cursor: "pointer", border: "none", background: isActive ? "rgba(22,163,74,0.12)" : "transparent" }}>
                  <Icon size={17} strokeWidth={isActive ? 2 : 1.7}
                    style={{ color: isActive ? "#4ADE80" : "#475569", flexShrink: 0 }} />
                  <span className="text-sm font-medium" style={{ color: isActive ? "#F8FAFC" : "#64748B" }}>{label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#4ADE80" }} />}
                </button>
              );
            })}
          </nav>

          <div className="px-4 pb-6">
            <div className="rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg, rgba(22,163,74,0.12), rgba(74,222,128,0.06))", border: "1px solid rgba(74,222,128,0.15)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: "#4ADE80", boxShadow: "0 0 6px #4ADE80" }} />
                <span className="text-xs font-semibold" style={{ color: "#4ADE80" }}>Today&apos;s Logged</span>
              </div>
              <div className="text-xl font-bold" style={{ color: "#F8FAFC", letterSpacing: "-0.03em" }}>{formatCarbonValue(totalCarbon, unit)} <span className="text-xs font-normal" style={{ color: "#64748B" }}>{unitLabel(unit)} CO₂</span></div>
              <div className="mt-3 rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((totalCarbon / DAILY_TARGET) * 100, 100)}%`, background: `linear-gradient(90deg, ${ringColor}, ${ringColor}cc)` }} />
              </div>              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: "#475569" }}>Daily target</span>
                <span className="text-xs" style={{ color: "#4ADE80" }}>{formatCarbon(DAILY_TARGET, unit)}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── MAIN AREA ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* TOP NAVBAR */}
          <header 
            className="flex items-center justify-between px-8 flex-shrink-0"
            style={{
              height: 64,
              background: "rgba(248,250,252,0.9)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(15,23,42,0.07)",
              position: "relative",
              zIndex: 1000,
            }}
            >
            <div className="flex items-center gap-2.5 rounded-xl px-4 py-2"
              style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)", width: 260, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <Search size={15} style={{ color: "#94A3B8" }} strokeWidth={1.8} />
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities..."
                style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#0F172A", width: "100%", fontFamily: "inherit" }}
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}>
                  <X size={12} />
                </button>
              ) : (
                <kbd className="text-xs rounded-md px-1.5 py-0.5 font-mono"
                  style={{ background: "#F1F5F9", color: "#94A3B8", fontSize: 10, border: "1px solid rgba(15,23,42,0.08)" }}>⌘K</kbd>
              )}
            </div>

            <div className="flex items-center gap-4">
              <CarbonTicker totalCarbon={totalCarbon} loading={scoreLoading} />

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
        className="absolute flex items-center justify-center rounded-full text-white font-bold"
        style={{
          width: 15,
          height: 15,
          background: "#EF4444",
          fontSize: 9,
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

              <div className="flex items-center gap-2.5 cursor-pointer">
                <div className="flex items-center justify-center rounded-xl font-semibold text-sm"
                  style={{ width: 38, height: 38, background: "linear-gradient(135deg, #16A34A, #4ADE80)", color: "white", boxShadow: "0 2px 8px rgba(22,163,74,0.25)" }}>
                  {displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                </div>
                <div>
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

          {/* CONTENT */}
          <div className="flex-1 overflow-hidden flex">

            {/* LEFT: LOG FORM */}
            <div className="flex-1 overflow-y-auto px-8 py-7">

              {/* Page header */}
              <div className="mb-7" style={{ animation: "fadeUp 0.4s ease forwards", opacity: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={18} style={{ color: "#16A34A" }} strokeWidth={2} />
                  <h1 className="font-bold" style={{ fontSize: 20, color: "#0F172A", letterSpacing: "-0.025em" }}>Activity Logger</h1>
                </div>
                <p className="text-sm" style={{ color: "#64748B" }}>
                  Log your daily activities to track your real-time carbon footprint.
                </p>
              </div>

              {/* Tab bar */}
              <div className="rounded-2xl p-1.5 mb-6 flex gap-1"
                style={{ background: "#F1F5F9", border: "1px solid rgba(15,23,42,0.07)", animation: "fadeUp 0.4s ease forwards", animationDelay: "0.08s", opacity: 0 }}>
                {(["travel", "food", "electricity"] as Tab[]).map((tab) => {
                  const icons: Record<Tab, React.ElementType> = { travel: Car, food: Utensils, electricity: Zap };
                  const labels: Record<Tab, string> = { travel: "Travel", food: "Food", electricity: "Electricity" };
                  const accents: Record<Tab, string> = { travel: "#3B82F6", food: "#F59E0B", electricity: "#8B5CF6" };
                  const Icon = icons[tab];
                  const isActive = activeTab === tab;
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`tab-btn ${isActive ? "tab-active" : "tab-inactive"}`}
                      style={{ color: isActive ? accents[tab] : "#64748B" }}>
                      <Icon size={15} strokeWidth={isActive ? 2 : 1.7} />
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              {/* Form card */}
              <form onSubmit={handleSubmit}>
                <div className="rounded-2xl p-6 mb-4"
                  style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)", animation: "fadeUp 0.4s ease forwards", animationDelay: "0.15s", opacity: 0 }}>

                  {activeTab === "travel" && (
                    <TravelForm
                      transport={transport}
                      setTransport={setTransport}
                      distance={distance}
                      setDistance={setDistance}
                      travelDate={travelDate}
                      setTravelDate={setTravelDate}
                    />
                  )}

                  {activeTab === "food" && (
                    <FoodForm
                      meal={meal}
                      setMeal={setMeal}
                      quantity={quantity}
                      setQuantity={setQuantity}
                    />
                  )}

                  {activeTab === "electricity" && (
                    <ElectricityForm
                      appliance={appliance}
                      setAppliance={setAppliance}
                      hoursUsed={hoursUsed}
                      setHoursUsed={setHoursUsed}
                      elecDate={elecDate}
                      setElecDate={setElecDate}
                    />
                  )}
                </div>

                {/* Preview bar */}
                <div className="rounded-2xl p-4 mb-4 flex items-center justify-between"
                  style={{
                    background: preview > 0 ? (preview > 5 ? "rgba(239,68,68,0.04)" : preview > 2 ? "rgba(245,158,11,0.04)" : "rgba(22,163,74,0.04)") : "#F8FAFC",
                    border: `1.5px solid ${preview > 0 ? (preview > 5 ? "rgba(239,68,68,0.15)" : preview > 2 ? "rgba(245,158,11,0.15)" : "rgba(22,163,74,0.15)") : "rgba(15,23,42,0.07)"}`,
                    transition: "all 0.3s ease",
                    animation: "fadeUp 0.4s ease forwards", animationDelay: "0.22s", opacity: 0,
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-xl"
                      style={{ width: 40, height: 40, background: preview > 0 ? (preview > 5 ? "rgba(239,68,68,0.1)" : preview > 2 ? "rgba(245,158,11,0.1)" : "rgba(22,163,74,0.1)") : "rgba(15,23,42,0.04)" }}>
                      <Flame size={18}
                        style={{ color: preview > 0 ? (preview > 5 ? "#EF4444" : preview > 2 ? "#F59E0B" : "#16A34A") : "#94A3B8" }}
                        strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="text-xs font-medium" style={{ color: "#64748B" }}>Carbon impact preview</div>
                      <div className="font-bold text-lg tabular-nums" style={{ color: preview > 5 ? "#EF4444" : preview > 2 ? "#F59E0B" : preview > 0 ? "#16A34A" : "#94A3B8", letterSpacing: "-0.03em", transition: "color 0.3s" }}>
                        {formatCarbonValue(preview, unit)} <span className="text-sm font-medium" style={{ color: "#94A3B8" }}>{unitLabel(unit)} CO₂</span>
                      </div>
                    </div>
                  </div>
                  {preview > 0 && (
                    <div className="text-right">
                      <div className="text-xs" style={{ color: "#94A3B8" }}>Equivalent to</div>
                      <div className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                        {(preview * 4.6).toFixed(1)} km driven
                      </div>
                      <div className="text-xs" style={{ color: "#94A3B8" }}>by avg. petrol car</div>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button type="submit" disabled={preview <= 0}
                  className={`submit-btn ${submitted ? "success" : ""}`}
                  style={{ animation: "fadeUp 0.4s ease forwards", animationDelay: "0.28s", opacity: 0 }}>
                  {submitted ? (
                    <><CheckCircle2 size={16} />Activity logged successfully!</>
                  ) : (
                    <><Plus size={16} />Log This Activity</>
                  )}
                </button>
              </form>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-shrink-0 overflow-y-auto px-6 py-7 flex flex-col gap-4"
              style={{ width: 320, borderLeft: "1px solid rgba(15,23,42,0.07)" }}>

              {/* Live Impact Card */}
              <div className="rounded-2xl p-5"
                style={{ background: "linear-gradient(145deg, #0F172A, #0a1628, #071a0e)", boxShadow: "0 2px 4px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.12)", animation: "fadeUp 0.5s ease forwards", animationDelay: "0.1s", opacity: 0 }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: ringColor, boxShadow: `0 0 6px ${ringColor}` }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#4ADE80", fontSize: 10 }}>Live Carbon Score</span>
                </div>

                {/* Ring + score */}
                <div className="flex items-center justify-between mb-4">
                  <div className="relative flex items-center justify-center" style={{ width: 130, height: 130 }}>
                    <ProgressRing value={totalCarbon} max={DAILY_TARGET} color={ringColor} />
                    <div className="absolute flex flex-col items-center">
                      <span className="font-bold tabular-nums" style={{ fontSize: 22, color: "#F8FAFC", letterSpacing: "-0.04em", lineHeight: 1 }}>{formatCarbonValue(totalCarbon, unit)}</span>
                      <span className="text-xs mt-0.5" style={{ color: "#64748B" }}>{unitLabel(unit)} CO₂</span>
                    </div>
                  </div>
                  <div className="flex-1 ml-4 flex flex-col gap-2.5">
                    {[
                      { label: "Today", value: formatCarbon(totalCarbon, unit), color: ringColor },
                      { label: "Target", value: formatCarbon(DAILY_TARGET, unit), color: "#334155" },
                      { label: "Remaining", value: formatCarbon(Math.max(0, DAILY_TARGET - totalCarbon), unit), color: "#4ADE80" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="text-xs mb-0.5" style={{ color: "#475569" }}>{label}</div>
                        <div className="font-bold text-sm tabular-nums" style={{ color, letterSpacing: "-0.02em" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sustainability rating */}
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>Sustainability Rating</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(22,163,74,0.15)", color: "#4ADE80" }}>{monthStats.daysLogged > 0 ? grade : "—"}</span>
                  </div>
                  <div className="flex gap-1">
                    {["A+", "A", "B+", "B", "C", "D"].map((g, i) => (
                      <div key={g} className="flex-1 rounded-md text-center py-1 text-xs font-bold transition-all"
                        style={{
                          background: g === grade ? "#16A34A" : i < 2 ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.04)",
                          color: g === grade ? "#fff" : i < 2 ? "#4ADE80" : "#334155",
                          fontSize: 10,
                        }}>{g}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Today's summary */}
              <div className="rounded-2xl p-4"
                style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animation: "fadeUp 0.5s ease forwards", animationDelay: "0.18s", opacity: 0 }}>
                <h3 className="font-semibold text-sm mb-4" style={{ color: "#0F172A", letterSpacing: "-0.01em" }}>Today&apos;s Summary</h3>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: "Travel", raw: todayBreakdown.travelCarbon, color: "#3B82F6", icon: Car },
                    { label: "Food", raw: todayBreakdown.foodCarbon, color: "#F59E0B", icon: Utensils },
                    { label: "Electricity", raw: todayBreakdown.electricityCarbon, color: "#8B5CF6", icon: Zap },
                  ].map(({ label, raw, color, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                        style={{ width: 30, height: 30, background: `${color}10` }}>
                        <Icon size={13} style={{ color }} strokeWidth={1.8} />
                      </div>
                      <span className="text-sm flex-1" style={{ color: "#64748B" }}>{label}</span>
                      <span className="font-semibold text-sm tabular-nums" style={{ color: "#0F172A" }}>{formatCarbon(raw, unit)}</span>
                      <div className="rounded-full overflow-hidden" style={{ width: 48, height: 4, background: `${color}15` }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min((raw / 8) * 100, 100)}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animation: "fadeUp 0.5s ease forwards", animationDelay: "0.25s", opacity: 0 }}>
                <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
                  <h3 className="font-semibold text-sm" style={{ color: "#0F172A", letterSpacing: "-0.01em" }}>Recent Activities</h3>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "#16A34A", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                    See all →
                  </button>
                </div>
                <div className="divide-y" style={{ maxHeight: 240, overflowY: "auto" }}>
                  {filteredActivities.length === 0 && (
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs text-slate-400">No activities match "{searchQuery}"</p>
                    </div>
                  )}
                  {filteredActivities.slice(0, 5).map((a) => {
                    const Icon = a.icon;
                    return (
                      <div key={a.id} className="activity-row flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                          style={{ width: 32, height: 32, background: `${a.color}10` }}>
                          <Icon size={14} style={{ color: a.color }} strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate" style={{ color: "#0F172A" }}>{a.label}</div>
                          <div className="text-xs" style={{ color: "#94A3B8" }}>{a.time}</div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <span className="font-bold text-xs tabular-nums" style={{ color: getDeltaColor(a.delta) }}>{formatCarbon(a.co2, unit)}</span>                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: getDeltaBg(a.delta), color: getDeltaColor(a.delta), fontSize: 9 }}>
                            {a.delta}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="rounded-2xl p-4"
                style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.05), rgba(124,58,237,0.02))", border: "1px solid rgba(79,70,229,0.1)", animation: "fadeUp 0.5s ease forwards", animationDelay: "0.32s", opacity: 0 }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center rounded-xl"
                    style={{ width: 26, height: 26, background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                    <Brain size={12} color="white" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#4F46E5" }}>AI Recommendations</span>
                  <Sparkles size={11} style={{ color: "#7C3AED" }} />
                </div>
                {[
                  { tip: "Try cycling for trips under 5 km — zero emissions, better health.", icon: Bike, color: "#16A34A" },
                  { tip: "Plant-based dinner tonight could save 5.7 kg CO₂ vs beef.", icon: Salad, color: "#22C55E" },
                  { tip: "Your electricity peaks at 7–9 PM. Shift usage to off-peak.", icon: Zap, color: "#8B5CF6" },
                ].map(({ tip, icon: Icon, color }, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-2.5 last:mb-0">
                    <div className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                      style={{ width: 24, height: 24, background: `${color}10` }}>
                      <Icon size={11} style={{ color }} strokeWidth={2} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
