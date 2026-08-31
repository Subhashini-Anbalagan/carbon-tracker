import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { navRoutes } from "../navRoutes";
import { useAuth } from "../../hooks/useAuth";
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../../services/firebase";
import {
  Leaf, LayoutDashboard, Activity, BarChart3, FileText, Settings,
  Bell, ChevronDown, User, Lock, Globe, Palette, Database,
  Shield, Trash2, Download, LogOut, ChevronRight, Check,
  Zap, Car, Utensils, Smartphone,
  Mail, MessageSquare, TrendingDown, Camera, Edit3, Save, X
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Activity, label: "Activity Logger" },
  { icon: BarChart3, label: "Analytics" },
  { icon: FileText, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Palette },
  { id: "carbon", label: "Carbon Settings", icon: TrendingDown },
  { id: "privacy", label: "Privacy & Data", icon: Shield },
  { id: "account", label: "Account", icon: Lock },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeNav, setActiveNav] = useState("Settings");
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [city, setCity] = useState("Chennai");
  const [vehicleType, setVehicleType] = useState("scooty");
  const [dietType, setDietType] = useState("vegetarian");

  // Preferences
  const [unit, setUnit] = useState("kg");
  const [language, setLanguage] = useState("English");
  const [dailyTarget, setDailyTarget] = useState("15");

  const [exporting, setExporting] = useState(false);
  const [deletingLogs, setDeletingLogs] = useState(false);

  // Sync display name once Firebase Auth finishes loading the user object
  // (it can be null on first render, so the useState default alone misses it)
  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user?.displayName]);

  // Load previously saved settings from Firestore on mount
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.displayName) setDisplayName(data.displayName);
        if (data.city) setCity(data.city);
        if (data.vehicleType) setVehicleType(data.vehicleType);
        if (data.dietType) setDietType(data.dietType);
        if (data.unit) setUnit(data.unit);
        if (data.dailyTarget) setDailyTarget(String(data.dailyTarget));
      })
      .catch((err) => console.error("Failed to load settings:", err));
  }, [user?.uid]);

  const handleSave = async () => {
    if (!user?.uid) return;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName,
          city,
          vehicleType,
          dietType,
          unit,
          dailyTarget: Number(dailyTarget) || 15,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Couldn't save your settings — check the browser console for details.");
    }
  };

  const handleExportData = async () => {
    if (!user?.uid) return;
    setExporting(true);
    try {
      const actionsSnap = await getDocs(collection(db, "users", user.uid, "actions"));
      const actions = actionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const payload = {
        profile: { displayName, email: user.email, city, vehicleType, dietType },
        preferences: { unit, dailyTarget },
        actions,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EcoTrack-Data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Couldn't export your data — check the browser console for details.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteLogs = async () => {
    if (!user?.uid) return;
    if (!window.confirm("Delete all your logged activities? This cannot be undone.")) return;
    setDeletingLogs(true);
    try {
      const actionsSnap = await getDocs(collection(db, "users", user.uid, "actions"));
      const batch = writeBatch(db);
      actionsSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      alert("All activity logs deleted.");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Couldn't delete your logs — check the browser console for details.");
    } finally {
      setDeletingLogs(false);
    }
  };

  const initials = displayName
    ?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

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
        .nav-btn { transition: background 0.12s; border: none; background: transparent; cursor: pointer; }
        .nav-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .section-btn { transition: all 0.15s; border: none; cursor: pointer; text-align: left; width: 100%; }
        .section-btn:hover { background: #F8FAFC !important; }
        .settings-input {
          width: 100%; padding: 10px 14px;
          background: #F8FAFC; border: 1.5px solid rgba(15,23,42,0.09);
          border-radius: 12px; font-size: 14px; color: #0F172A;
          outline: none; transition: all 0.18s ease; font-family: 'Inter', sans-serif;
        }
        .settings-input:focus {
          border-color: #16A34A; background: #fff;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.1);
        }
        .toggle {
          width: 44px; height: 24px; border-radius: 12px; border: none;
          cursor: pointer; transition: background 0.2s ease; position: relative; flex-shrink: 0;
        }
        .toggle-thumb {
          position: absolute; top: 3px; width: 18px; height: 18px;
          border-radius: 9px; background: white;
          transition: left 0.2s ease;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .option-card {
          flex: 1; padding: 10px 14px; border-radius: 12px; border: 1.5px solid rgba(15,23,42,0.08);
          background: #F8FAFC; cursor: pointer; transition: all 0.15s; text-align: center;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500;
        }
        .option-card:hover { border-color: rgba(22,163,74,0.3); }
        .option-card.selected { border-color: #16A34A; background: rgba(22,163,74,0.05); color: #16A34A; font-weight: 600; }
        .save-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 24px; background: linear-gradient(135deg, #16A34A, #15803D);
          color: white; border: none; border-radius: 12px; font-size: 14px;
          font-weight: 600; cursor: pointer; transition: all 0.18s ease;
          font-family: 'Inter', sans-serif;
        }
        .save-btn:hover { background: linear-gradient(135deg, #15803D, #14532D); box-shadow: 0 6px 20px rgba(22,163,74,0.35); transform: translateY(-1px); }
        .save-btn.success { background: linear-gradient(135deg, #16A34A, #4ADE80); }
        .danger-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px; background: rgba(239,68,68,0.06);
          color: #EF4444; border: 1.5px solid rgba(239,68,68,0.2);
          border-radius: 12px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif;
        }
        .danger-btn:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.35); }
        .notif-dot { width: 5px; height: 5px; background: #EF4444; border-radius: 50%; animation: tickerBlink 2s ease-in-out infinite; }
      `}</style>

      <div className="flex w-screen h-screen overflow-hidden" style={{ background: "#F8FAFC" }}>

        {/* ── SIDEBAR ── */}
        <aside className="flex flex-col h-full flex-shrink-0"
          style={{ width: 240, background: "#0F172A", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3 px-6 pt-7 pb-8">
            <div className="flex items-center justify-center rounded-xl flex-shrink-0"
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
            {navItems.map(({ icon: Icon, label }) => {
              const isActive = activeNav === label;
              return (
                <button key={label} onClick={() => {
                    setActiveNav(label);
                    if (navRoutes[label] && navRoutes[label] !== "/settings") navigate(navRoutes[label]);
                  }}
                  className="nav-btn flex items-center gap-3 px-3 py-2.5 rounded-xl w-full"
                  style={{ background: isActive ? "rgba(22,163,74,0.12)" : "transparent" }}>
                  <Icon size={17} strokeWidth={isActive ? 2 : 1.7}
                    style={{ color: isActive ? "#4ADE80" : "#475569", flexShrink: 0 }} />
                  <span className="text-sm font-medium" style={{ color: isActive ? "#F8FAFC" : "#64748B" }}>{label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#4ADE80" }} />}
                </button>
              );
            })}
          </nav>

        </aside>

        {/* ── MAIN AREA ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* NAVBAR */}
          <header className="flex items-center justify-between px-8 flex-shrink-0"
            style={{ height: 64, background: "rgba(248,250,252,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(15,23,42,0.07)", position: "relative", zIndex: 1000 }}>
            <div>
              <h1 className="font-bold" style={{ fontSize: 16, color: "#0F172A", letterSpacing: "-0.02em" }}>Settings</h1>
              <p style={{ fontSize: 12, color: "#94A3B8" }}>Manage your account and preferences</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 cursor-pointer">
                <div className="flex items-center justify-center rounded-xl font-semibold"
                  style={{ width: 38, height: 38, background: "linear-gradient(135deg, #16A34A, #4ADE80)", color: "white", fontSize: 13, boxShadow: "0 2px 8px rgba(22,163,74,0.25)" }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{displayName || "User"}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{user?.email || ""}</div>
                </div>
                <ChevronDown size={14} style={{ color: "#94A3B8" }} />
              </div>
              <button onClick={logout}
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#EF4444", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Logout
              </button>
            </div>
          </header>

          {/* BODY */}
          <div className="flex-1 overflow-hidden flex">

            {/* Settings nav */}
            <div className="flex-shrink-0 py-6 px-4 flex flex-col gap-1"
              style={{ width: 220, borderRight: "1px solid rgba(15,23,42,0.07)", background: "#ffffff" }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingLeft: 8 }}>
                Settings Menu
              </p>
              {SECTIONS.map(({ id, label, icon: Icon }) => {
                const isActive = activeSection === id;
                return (
                  <button key={id} onClick={() => setActiveSection(id)}
                    className="section-btn flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: isActive ? "rgba(22,163,74,0.08)" : "transparent", border: isActive ? "1px solid rgba(22,163,74,0.15)" : "1px solid transparent" }}>
                    <Icon size={16} strokeWidth={isActive ? 2 : 1.7}
                      style={{ color: isActive ? "#16A34A" : "#64748B", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? "#0F172A" : "#64748B" }}>{label}</span>
                    {isActive && <ChevronRight size={13} style={{ color: "#16A34A", marginLeft: "auto" }} />}
                  </button>
                );
              })}
            </div>

            {/* Settings content */}
            <div className="flex-1 overflow-y-auto px-8 py-7">

              {/* ── PROFILE ── */}
              {activeSection === "profile" && (
                <div style={{ maxWidth: 600, animation: "fadeUp 0.4s ease forwards", opacity: 0 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 4 }}>Profile Settings</h2>
                  <p style={{ fontSize: 13, color: "#64748B", marginBottom: 28 }}>Update your personal information and preferences.</p>

                  {/* Avatar */}
                  <div className="flex items-center gap-5 mb-8 p-5 rounded-2xl"
                    style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div className="flex items-center justify-center rounded-2xl font-bold"
                      style={{ width: 72, height: 72, background: "linear-gradient(135deg, #16A34A, #4ADE80)", color: "white", fontSize: 26, boxShadow: "0 4px 16px rgba(74,222,128,0.3)" }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>{displayName || "User"}</div>
                      <div style={{ fontSize: 13, color: "#64748B" }}>{user?.email || ""}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-6"
                    style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 20 }}>Personal Information</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Display Name</label>
                        <input className="settings-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>City</label>
                        <input className="settings-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Email Address</label>
                      <input className="settings-input" value={user?.email || ""} disabled
                        style={{ opacity: 0.6, cursor: "not-allowed" }} />
                      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>Email is managed by Google Sign-In and cannot be changed here.</p>
                    </div>

                    <div className="mb-4">
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 10 }}>Primary Vehicle</label>
                      <div className="flex gap-2">
                        {[
                          { id: "scooty", label: "Scooty", icon: "🛵" },
                          { id: "car", label: "Car", icon: "🚗" },
                          { id: "bus", label: "Bus", icon: "🚌" },
                          { id: "cycle", label: "Cycle", icon: "🚲" },
                          { id: "none", label: "None", icon: "🚶" },
                        ].map(({ id, label, icon }) => (
                          <button key={id} onClick={() => setVehicleType(id)}
                            className={`option-card ${vehicleType === id ? "selected" : ""}`}>
                            <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                            <div style={{ fontSize: 11 }}>{label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 10 }}>Diet Type</label>
                      <div className="flex gap-2">
                        {[
                          { id: "vegan", label: "Vegan" },
                          { id: "vegetarian", label: "Vegetarian" },
                          { id: "non-veg", label: "Non-Veg" },
                        ].map(({ id, label }) => (
                          <button key={id} onClick={() => setDietType(id)}
                            className={`option-card ${dietType === id ? "selected" : ""}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button onClick={handleSave} className={`save-btn ${saved ? "success" : ""}`}>
                    {saved ? <><Check size={16} />Saved!</> : <><Save size={16} />Save Changes</>}
                  </button>
                </div>
              )}

              {/* ── PREFERENCES ── */}
              {activeSection === "preferences" && (
                <div style={{ maxWidth: 600, animation: "fadeUp 0.4s ease forwards", opacity: 0 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 4 }}>Preferences</h2>
                  <p style={{ fontSize: 13, color: "#64748B", marginBottom: 28 }}>Customize how EcoTrack looks and works for you.</p>

                  <div className="rounded-2xl p-6 mb-4"
                    style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 20 }}>Appearance</h3>
                    <div className="mb-6">
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 10 }}>CO₂ Unit</label>
                      <div className="flex gap-3">
                        {["kg", "lbs", "tonnes"].map((u) => (
                          <button key={u} onClick={() => setUnit(u)}
                            className="option-card"
                            style={{ borderColor: unit === u ? "#16A34A" : "rgba(15,23,42,0.08)", background: unit === u ? "rgba(22,163,74,0.05)" : "#F8FAFC", color: unit === u ? "#16A34A" : "#64748B", fontWeight: unit === u ? 600 : 500 }}>
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Daily Carbon Target (kg)</label>
                      <input className="settings-input" type="number" value={dailyTarget}
                        onChange={(e) => setDailyTarget(e.target.value)}
                        style={{ maxWidth: 160 }} />
                      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>Global average is ~12 kg/day. Recommended target: 8–10 kg.</p>
                    </div>
                  </div>

                  <button onClick={handleSave} className={`save-btn ${saved ? "success" : ""}`}>
                    {saved ? <><Check size={16} />Saved!</> : <><Save size={16} />Save Changes</>}
                  </button>
                </div>
              )}

              {/* ── CARBON SETTINGS ── */}
              {activeSection === "carbon" && (
                <div style={{ maxWidth: 600, animation: "fadeUp 0.4s ease forwards", opacity: 0 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 4 }}>Carbon Settings</h2>
                  <p style={{ fontSize: 13, color: "#64748B", marginBottom: 28 }}>IPCC emission factors used in your calculations.</p>

                  <div className="rounded-2xl p-6 mb-4"
                    style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>Emission Factors (Read-only)</h3>
                    <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>Based on IPCC standard values. These are locked to ensure accuracy.</p>

                    <div style={{ marginBottom: 20 }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Car size={14} style={{ color: "#3B82F6" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Travel</span>
                      </div>
                      {[
                        { label: "Petrol Bike / Scooty", value: "0.113 kg CO₂/km" },
                        { label: "Car (Petrol)", value: "0.192 kg CO₂/km" },
                        { label: "Bus", value: "0.089 kg CO₂/km" },
                        { label: "Flight", value: "0.255 kg CO₂/km" },
                        { label: "Walk / Cycle", value: "0.000 kg CO₂/km" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-2.5 px-3 rounded-xl mb-1"
                          style={{ background: "#F8FAFC" }}>
                          <span style={{ fontSize: 13, color: "#64748B" }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{value}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Utensils size={14} style={{ color: "#F59E0B" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Food</span>
                      </div>
                      {[
                        { label: "Non-Veg Meal", value: "3.300 kg CO₂/meal" },
                        { label: "Veg Meal", value: "0.700 kg CO₂/meal" },
                        { label: "Junk Food", value: "2.500 kg CO₂/meal" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-2.5 px-3 rounded-xl mb-1"
                          style={{ background: "#F8FAFC" }}>
                          <span style={{ fontSize: 13, color: "#64748B" }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{value}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} style={{ color: "#8B5CF6" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Electricity</span>
                      </div>
                      <div className="flex justify-between py-2.5 px-3 rounded-xl"
                        style={{ background: "#F8FAFC" }}>
                        <span style={{ fontSize: 13, color: "#64748B" }}>TNEB Grid (Tamil Nadu)</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>0.820 kg CO₂/kWh</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PRIVACY ── */}
              {activeSection === "privacy" && (
                <div style={{ maxWidth: 600, animation: "fadeUp 0.4s ease forwards", opacity: 0 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 4 }}>Privacy & Data</h2>
                  <p style={{ fontSize: 13, color: "#64748B", marginBottom: 28 }}>Control how your data is stored and used.</p>

                  <div className="rounded-2xl p-6 mb-4"
                    style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    {[
                      { title: "Data Storage", desc: "Your data is stored securely in Firebase Firestore (asia-south1, Mumbai region).", badge: "Encrypted", badgeColor: "#16A34A" },
                      { title: "Authentication", desc: "Login handled by Firebase Auth — your password is never stored by EcoTrack.", badge: "Google OAuth", badgeColor: "#3B82F6" },
                      { title: "AI Processing", desc: "Your activity data is sent to Gemini AI only to generate tips. Nothing is stored by Google AI.", badge: "Privacy Safe", badgeColor: "#8B5CF6" },
                    ].map(({ title, desc, badge, badgeColor }) => (
                      <div key={title} className="flex items-start gap-4 py-4"
                        style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
                        <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                          style={{ width: 40, height: 40, background: `${badgeColor}10` }}>
                          <Shield size={18} style={{ color: badgeColor }} strokeWidth={1.8} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{title}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: `${badgeColor}10`, color: badgeColor }}>{badge}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl p-6"
                    style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>Data Actions</h3>
                    <div className="flex flex-col gap-3">
                      <button className="danger-btn" onClick={handleExportData} disabled={exporting}>
                        <Download size={15} />
                        {exporting ? "Exporting..." : "Export My Data (JSON)"}
                      </button>
                      <button className="danger-btn" onClick={handleDeleteLogs} disabled={deletingLogs}>
                        <Trash2 size={15} />
                        {deletingLogs ? "Deleting..." : "Delete All Activity Logs"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ACCOUNT ── */}
              {activeSection === "account" && (
                <div style={{ maxWidth: 600, animation: "fadeUp 0.4s ease forwards", opacity: 0 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 4 }}>Account</h2>
                  <p style={{ fontSize: 13, color: "#64748B", marginBottom: 28 }}>Manage your account and subscription.</p>

                  <div className="rounded-2xl p-6 mb-4"
                    style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>Account Info</h3>
                    {[
                      { label: "Account Email", value: user?.email || "" },
                      { label: "Auth Provider", value: "Google Sign-In" },
                      { label: "Data Region", value: "asia-south1 (Mumbai)" },
                      { label: "Member Since", value: memberSince },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-3"
                        style={{ borderBottom: "1px solid rgba(15,23,42,0.05)" }}>
                        <span style={{ fontSize: 13, color: "#64748B" }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl p-6"
                    style={{ background: "#ffffff", border: "1px solid rgba(239,68,68,0.1)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#EF4444", marginBottom: 4 }}>Danger Zone</h3>
                    <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>These actions are permanent and cannot be undone.</p>
                    <div className="flex gap-3">
                      <button className="danger-btn" onClick={logout}>
                        <LogOut size={15} />
                        Sign Out
                      </button>
                      <button className="danger-btn" onClick={() => alert("Account deletion isn't available yet. To delete your account, remove it directly from the Firebase Console for now.")}>
                        <Trash2 size={15} />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}