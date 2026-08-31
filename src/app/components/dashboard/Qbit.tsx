import "./Qbit.css";

// Same color-threshold logic used everywhere else in the app (SpinningGlobe, ticker ring, etc.)
// score = % of daily carbon target used, 0-100, LOWER is better
const getQbitColor = (score: number) => {
  if (score < 40) return { primary: "#22C55E", secondary: "#4ADE80", dark: "#15803D" };
  if (score < 65) return { primary: "#F59E0B", secondary: "#FCD34D", dark: "#B45309" };
  return { primary: "#EF4444", secondary: "#F87171", dark: "#B91C1C" };
};

interface QbitProps {
  score: number;      // 0-100, same scale as SpinningGlobe (lower = better)
  size?: number;       // rendered width in px, height scales with it (viewBox 120x150)
  caption?: string;    // small optional label under the robot
}

export const Qbit = ({ score, size = 64, caption }: QbitProps) => {
  const c = getQbitColor(score);
  const clamped = Math.max(0, Math.min(100, score));
  const isSad = clamped >= 65;
  const gradId = `qbitHeadGrad-${isSad ? "sad" : "ok"}`;

  return (
    <svg width={size} height={(size * 190) / 120} viewBox="0 0 120 190" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="qbitHeadGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id="qbitVisorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="174" rx="38" ry="6" fill="#0F172A" opacity="0.08" />

      {/* Static body — shoulders + chest, does not rotate with the head */}
      <g className="qbit-arm-left">
        <rect x="16" y="96" width="20" height="30" rx="10" fill="url(#qbitHeadGrad)" stroke="#334155" strokeWidth="2" />
        <circle cx="26" cy="130" r="9" fill="url(#qbitHeadGrad)" stroke="#334155" strokeWidth="2" />
      </g>
      <g className="qbit-arm-right">
        <rect x="84" y="96" width="20" height="30" rx="10" fill="url(#qbitHeadGrad)" stroke="#334155" strokeWidth="2" />
        <circle cx="94" cy="130" r="9" fill="url(#qbitHeadGrad)" stroke="#334155" strokeWidth="2" />
      </g>
      <rect x="38" y="100" width="44" height="26" rx="10" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />
      <circle cx="60" cy="113" r="5" fill={c.primary} stroke={c.dark} strokeWidth="1.5" />
      <g className="qbit-leg-left">
        <rect x="44" y="128" width="14" height="28" rx="7" fill="url(#qbitHeadGrad)" stroke="#334155" strokeWidth="2" />
        <ellipse cx="51" cy="160" rx="11" ry="6" fill="url(#qbitHeadGrad)" stroke="#334155" strokeWidth="2" />
      </g>
      <g className="qbit-leg-right">
        <rect x="62" y="128" width="14" height="28" rx="7" fill="url(#qbitHeadGrad)" stroke="#334155" strokeWidth="2" />
        <ellipse cx="69" cy="160" rx="11" ry="6" fill="url(#qbitHeadGrad)" stroke="#334155" strokeWidth="2" />
      </g>

      {/* Head — rotates gently as part of the idle cycle */}
      <g className="qbit-head-group">
        <line x1="60" y1="6" x2="60" y2="20" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="6" r="7" fill={c.secondary} opacity="0.35" />
        <circle cx="60" cy="6" r="4" fill={c.secondary} stroke={c.dark} strokeWidth="1.5" />

        <circle cx="14" cy="58" r="7" fill="url(#qbitHeadGrad)" stroke="#334155" strokeWidth="2" />
        <circle cx="106" cy="58" r="7" fill="url(#qbitHeadGrad)" stroke="#334155" strokeWidth="2" />

        <rect x="22" y="22" width="76" height="72" rx="22" fill="url(#qbitHeadGrad)" stroke="#334155" strokeWidth="2.5" />
        <ellipse cx="42" cy="36" rx="14" ry="8" fill="#ffffff" opacity="0.4" transform="rotate(-18 42 36)" />

        <rect x="34" y="36" width="52" height="38" rx="14" fill="url(#qbitVisorGrad)" stroke="#1E293B" strokeWidth="1.5" />

        {isSad ? (
          <>
            <line x1="42" y1="50" x2="52" y2="60" stroke={c.secondary} strokeWidth="3" strokeLinecap="round" />
            <line x1="52" y1="50" x2="42" y2="60" stroke={c.secondary} strokeWidth="3" strokeLinecap="round" />
            <line x1="68" y1="50" x2="78" y2="60" stroke={c.secondary} strokeWidth="3" strokeLinecap="round" />
            <line x1="78" y1="50" x2="68" y2="60" stroke={c.secondary} strokeWidth="3" strokeLinecap="round" />
            <path d="M 46 70 Q 60 64 74 70" fill="none" stroke={c.secondary} strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Idle glowing-dot eyes, crossfades out during the laugh */}
            <circle cx="48" cy="55" r="8" fill={c.secondary} opacity="0.25" className="qbit-eyes-idle" />
            <circle cx="72" cy="55" r="8" fill={c.secondary} opacity="0.25" className="qbit-eyes-idle" />
            <circle cx="48" cy="55" r="4" fill={c.secondary} className="qbit-eyes-idle" />
            <circle cx="72" cy="55" r="4" fill={c.secondary} className="qbit-eyes-idle" />
            {/* Happy ^^ arc eyes, crossfades in briefly each cycle */}
            <path d="M 42 58 Q 48 50 54 58" fill="none" stroke={c.secondary} strokeWidth="3" strokeLinecap="round" className="qbit-eyes-happy" />
            <path d="M 66 58 Q 72 50 78 58" fill="none" stroke={c.secondary} strokeWidth="3" strokeLinecap="round" className="qbit-eyes-happy" />
            {/* Eyelid — closes briefly over the right eye for the wink */}
            <rect x="66" y="48" width="14" height="14" rx="4" fill="#0F172A" className="qbit-eyelid-right" />
            <rect x="50" y="66" width="20" height="4" rx="2" fill={c.secondary} opacity="0.55" />
          </>
        )}
      </g>

      {caption && (
        <text x="60" y="186" textAnchor="middle" fontSize="10" fill="#64748B">
          {caption}
        </text>
      )}
    </svg>
  );
};