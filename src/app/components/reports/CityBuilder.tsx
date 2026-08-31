import { TreePine, Sun, Bike, Building2, CloudFog, Factory, CarFront, Gauge, CloudSun, CloudRain, Minus } from "lucide-react";

interface DayWeather {
  date: string;
  label: string;
  weather: "sun" | "cloud" | "rain" | "none";
}

interface CityBuilderProps {
  greenCount: number;
  badCount: number;
  health: number;
  topHabit: { label: string; count: number } | null;
  weekWeather: DayWeather[];
  loading: boolean;
}

const WEATHER_ICON = { sun: Sun, cloud: CloudSun, rain: CloudRain, none: Minus };
const WEATHER_COLOR = { sun: "#16A34A", cloud: "#F59E0B", rain: "#EF4444", none: "#CBD5E1" };

const GREEN_ICONS = [TreePine, Sun, Bike, Building2];
const POLLUTION_ICONS = [CloudFog, Factory, CarFront];

const healthColor = (health: number) =>
  health > 70 ? "#16A34A" : health >= 40 ? "#F59E0B" : "#EF4444";

export const CityBuilder = ({ greenCount, badCount, health, topHabit, weekWeather = [], loading }: CityBuilderProps) => {
  const color = healthColor(health);
  // City starts with 3 base buildings, then grows with real green actions
  const greenTiles = Array.from({ length: 3 + greenCount }, (_, i) => GREEN_ICONS[i % GREEN_ICONS.length]);
  const pollutionTiles = Array.from({ length: badCount }, (_, i) => POLLUTION_ICONS[i % POLLUTION_ICONS.length]);

  return (
    <div className="card report-section" style={{
      height: "100%", display: "flex", flexDirection: "column",
      animationDelay: "0.22s", borderRadius: 20, padding: 18,
      background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em" }}>Carbon City Builder</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color }}>
          <Gauge size={12} />
          {loading ? "…" : `${health}%`}
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>
        Your last 7 days of actions, built into a city
      </p>

      {/* Health bar */}
      <div style={{ height: 6, background: "rgba(15,23,42,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
        <div style={{
          height: "100%", width: `${loading ? 0 : health}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`, transition: "width 0.6s ease",
        }} />
      </div>

      {/* City grid */}
      <div style={{
        flex: 1, minHeight: 44, borderRadius: 14, padding: 14, background: `${color}08`, border: `1px solid ${color}20`,
        display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", alignContent: "flex-start",
      }}>
        {loading ? (
          <span style={{ fontSize: 11, color: "#94A3B8" }}>Loading your city…</span>
        ) : (
          <>
            {greenTiles.map((Icon, i) => (
              <div key={`g-${i}`} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(22,163,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} style={{ color: "#16A34A" }} strokeWidth={1.8} />
              </div>
            ))}
            {pollutionTiles.map((Icon, i) => (
              <div key={`p-${i}`} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} style={{ color: "#EF4444" }} strokeWidth={1.8} />
              </div>
            ))}
          </>
        )}
      </div>

      <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 10, lineHeight: 1.5 }}>
        {loading
          ? "Reading your recent actions…"
          : badCount === 0
          ? "No pollution this week — your city is thriving."
          : `${greenCount + 3} green builds vs ${badCount} pollution elements this week.`}
      </p>

      {!loading && topHabit && (
        <div style={{
          marginTop: 10, padding: "8px 10px", borderRadius: 10,
          background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 10, color: "#64748B" }}>Top habit this week</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>
            {topHabit.label} · {topHabit.count}×
          </span>
        </div>
      )}

      {!loading && weekWeather.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <span style={{ fontSize: 10, color: "#94A3B8" }}>7-day forecast</span>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {weekWeather.map((day) => {
              const Icon = WEATHER_ICON[day.weather];
              const c = WEATHER_COLOR[day.weather];
              return (
                <div key={day.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 9, color: "#94A3B8" }}>{day.label[0]}</span>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, background: `${c}12`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={13} style={{ color: c }} strokeWidth={1.8} />
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