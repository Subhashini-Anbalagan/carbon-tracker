import "./SpinningGlobe.css";

// Same color-threshold logic used everywhere else in the app (ticker ring, etc.)
const getEarthColor = (score: number) => {
  if (score < 40) return { primary: "#16A34A", secondary: "#4ADE80", glow: "rgba(22,163,74,0.35)" };
  if (score < 65) return { primary: "#F59E0B", secondary: "#FCD34D", glow: "rgba(245,158,11,0.35)" };
  return { primary: "#EF4444", secondary: "#F87171", glow: "rgba(239,68,68,0.35)" };
};

// Exact same landmass layout + viewBox as the proven working sample
// (viewBox 400x110, matched 1:1 to backgroundSize "400px 110px" — no
// scaling math, so no distortion). Only the fill color is dynamic.
const buildMapDataUri = (landColor: string) => {
  const c = landColor.replace("#", "%23");
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 110'>` +
    `<rect width='400' height='110' fill='%231E90FF'/>` +
    `<ellipse cx='60' cy='40' rx='18' ry='11' fill='${c}'/>` +
    `<ellipse cx='55' cy='52' rx='22' ry='14' fill='${c}'/>` +
    `<ellipse cx='75' cy='58' rx='13' ry='8' fill='${c}'/>` +
    `<ellipse cx='45' cy='62' rx='10' ry='6' fill='${c}'/>` +
    `<ellipse cx='150' cy='30' rx='24' ry='16' fill='${c}'/>` +
    `<ellipse cx='158' cy='50' rx='18' ry='22' fill='${c}'/>` +
    `<ellipse cx='145' cy='70' rx='11' ry='14' fill='${c}'/>` +
    `<ellipse cx='170' cy='42' rx='10' ry='13' fill='${c}'/>` +
    `<ellipse cx='220' cy='35' rx='22' ry='13' fill='${c}'/>` +
    `<ellipse cx='228' cy='52' rx='14' ry='18' fill='${c}'/>` +
    `<ellipse cx='240' cy='72' rx='8' ry='10' fill='${c}'/>` +
    `<ellipse cx='205' cy='50' rx='8' ry='11' fill='${c}'/>` +
    `<ellipse cx='290' cy='45' rx='13' ry='8' fill='${c}'/>` +
    `<ellipse cx='300' cy='58' rx='10' ry='11' fill='${c}'/>` +
    `<ellipse cx='310' cy='30' rx='16' ry='10' fill='${c}'/>` +
    `<ellipse cx='340' cy='48' rx='6' ry='5' fill='${c}'/>` +
    `<ellipse cx='360' cy='35' rx='18' ry='11' fill='${c}'/>` +
    `<ellipse cx='355' cy='52' rx='22' ry='14' fill='${c}'/>` +
    `<ellipse cx='375' cy='58' rx='13' ry='8' fill='${c}'/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${svg}")`;
};

interface SpinningGlobeProps {
  totalCarbon: number;   // today's live kg CO2 from useLiveScore
  dailyTarget?: number;  // kg CO2 considered "100% / maxed out" — matches ActivityLogger's DAILY_TARGET
}

export const SpinningGlobe = ({ totalCarbon, dailyTarget = 15 }: SpinningGlobeProps) => {
  // Convert kg CO2 into a 0-100 score, same scale used across the app
  const score = Math.min((totalCarbon / dailyTarget) * 100, 100);
  const earthColors = getEarthColor(score);

  // Spin speed + glow intensity react to score: low impact = slow calm spin
  // + soft glow, high impact = fast anxious spin + strong glow
  const spinDuration = score < 40 ? "8s" : score < 65 ? "4s" : "2s";
  const glowOpacity = totalCarbon <= 0 ? 0 : score < 40 ? 0.6 : 1;

  return (
    <div className="spinning-globe-outer">
      {/* Visually enlarges the pixel-perfect 110px globe to ~176px without
          touching any of the underlying sizing math */}
      <div className="spinning-globe-scaler" style={{ transform: "scale(1.6)" }}>
        {/* Reactive glow behind the globe */}
        <div
          className="spinning-globe-glow"
          style={{
            opacity: glowOpacity,
            boxShadow: `0 0 24px 10px ${earthColors.glow}, 0 0 48px 20px ${earthColors.glow.replace("0.35", "0.15")}`,
          }}
        />

        {/* Spinning globe */}
        <div
          className="spinning-globe-wrap"
          style={{
            boxShadow: "inset -10px -6px 16px rgba(0,0,0,0.35), inset 6px 4px 12px rgba(255,255,255,0.15)",
          }}
        >
          <div
            className="spinning-globe-map"
            style={{
              width: 220,
              height: 110,
              backgroundImage: buildMapDataUri(earthColors.secondary),
              backgroundSize: "400px 110px",
              animationDuration: spinDuration,
            }}
          />
          <div className="spinning-globe-overlay" />
        </div>
      </div>

      {/* Score badge */}
      <div
        className="spinning-globe-badge"
        style={{
          width: 64,
          height: 64,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}
      >
        <div className="font-bold text-xl" style={{ color: earthColors.primary, letterSpacing: "-0.04em" }}>
          {Math.round(score)}
        </div>
        <div className="text-xs font-medium" style={{ color: "#64748B" }}>Score</div>
      </div>
    </div>
  );
};