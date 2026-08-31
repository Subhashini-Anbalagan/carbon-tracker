import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Globe, Leaf, Shield, Eye, EyeOff, ArrowRight, Zap, Wind, Droplets, TreePine } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const FloatingIcon = ({
  icon: Icon,
  style,
  delay,
  size = 20,
  color = "#4ADE80",
}: {
  icon: React.ElementType;
  style: React.CSSProperties;
  delay: string;
  size?: number;
  color?: string;
}) => (
  <div
    className="absolute flex items-center justify-center rounded-2xl backdrop-blur-sm"
    style={{
      ...style,
      animation: `floatIcon 6s ease-in-out infinite`,
      animationDelay: delay,
      background: "rgba(74, 222, 128, 0.08)",
      border: "1px solid rgba(74, 222, 128, 0.2)",
      width: size + 24,
      height: size + 24,
    }}
  >
    <Icon size={size} color={color} strokeWidth={1.5} />
  </div>
);

const loginGlobeMapUrl =
  `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 110'>` +
  `<rect width='400' height='110' fill='%231E90FF'/>` +
  `<ellipse cx='60' cy='40' rx='18' ry='11' fill='%234ADE80'/>` +
  `<ellipse cx='55' cy='52' rx='22' ry='14' fill='%234ADE80'/>` +
  `<ellipse cx='75' cy='58' rx='13' ry='8' fill='%234ADE80'/>` +
  `<ellipse cx='45' cy='62' rx='10' ry='6' fill='%234ADE80'/>` +
  `<ellipse cx='150' cy='30' rx='24' ry='16' fill='%234ADE80'/>` +
  `<ellipse cx='158' cy='50' rx='18' ry='22' fill='%234ADE80'/>` +
  `<ellipse cx='145' cy='70' rx='11' ry='14' fill='%234ADE80'/>` +
  `<ellipse cx='170' cy='42' rx='10' ry='13' fill='%234ADE80'/>` +
  `<ellipse cx='220' cy='35' rx='22' ry='13' fill='%234ADE80'/>` +
  `<ellipse cx='228' cy='52' rx='14' ry='18' fill='%234ADE80'/>` +
  `<ellipse cx='240' cy='72' rx='8' ry='10' fill='%234ADE80'/>` +
  `<ellipse cx='205' cy='50' rx='8' ry='11' fill='%234ADE80'/>` +
  `<ellipse cx='290' cy='45' rx='13' ry='8' fill='%234ADE80'/>` +
  `<ellipse cx='300' cy='58' rx='10' ry='11' fill='%234ADE80'/>` +
  `<ellipse cx='310' cy='30' rx='16' ry='10' fill='%234ADE80'/>` +
  `<ellipse cx='340' cy='48' rx='6' ry='5' fill='%234ADE80'/>` +
  `<ellipse cx='360' cy='35' rx='18' ry='11' fill='%234ADE80'/>` +
  `<ellipse cx='355' cy='52' rx='22' ry='14' fill='%234ADE80'/>` +
  `<ellipse cx='375' cy='58' rx='13' ry='8' fill='%234ADE80'/>` +
  `</svg>")`;
const EarthSVG = () => (
  <div className="relative flex items-center justify-center" style={{ width: 340, height: 340 }}>
    {/* Outer glow ring */}
    <div
      className="absolute rounded-full"
      style={{
        width: 340,
        height: 340,
        background: "radial-gradient(circle, rgba(74,222,128,0.12) 0%, rgba(22,163,74,0.06) 50%, transparent 70%)",
        animation: "pulseGlow 4s ease-in-out infinite",
      }}
    />
    {/* Atmosphere ring */}
    <div
      className="absolute rounded-full"
      style={{
        width: 300,
        height: 300,
        border: "1.5px solid rgba(74, 222, 128, 0.15)",
        boxShadow: "0 0 40px rgba(74, 222, 128, 0.08), inset 0 0 40px rgba(74, 222, 128, 0.04)",
      }}
    />
    <div
      className="absolute rounded-full"
      style={{
        width: 272,
        height: 272,
        border: "1px solid rgba(74, 222, 128, 0.1)",
      }}
    />

    {/* Earth sphere */}
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width: 240,
        height: 240,
        boxShadow: "0 0 60px rgba(22, 163, 74, 0.3), 0 0 120px rgba(22, 163, 74, 0.1), inset -20px -20px 40px rgba(0,0,0,0.4), inset 8px 8px 20px rgba(74, 222, 128, 0.1)",
      }}
    >
      {/* Spinning landmass — 110px pixel-perfect box (matches viewBox 1:1),
          scaled up visually to fill the 240px sphere */}
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          width: 110,
          height: 110,
          transform: "translate(-50%, -50%) scale(2.18)",
        }}
      >
        <div className="relative rounded-full overflow-hidden" style={{ width: 110, height: 110 }}>
          <div
            className="absolute top-0 left-0"
            style={{
              width: 220,
              height: 110,
              backgroundImage: loginGlobeMapUrl,
              backgroundSize: "400px 110px",
              backgroundRepeat: "repeat-x",
              animation: "scrollMap 14s linear infinite",
            }}
          />
        </div>
      </div>

      {/* Atmosphere shimmer overlay */}
      <svg viewBox="0 0 240 240" className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.85 }}>
        <circle cx="120" cy="120" r="118" fill="none" stroke="rgba(74,222,128,0.15)" strokeWidth="4" />
        <ellipse cx="80" cy="60" rx="10" ry="6" fill="rgba(255,255,255,0.12)" transform="rotate(-30 80 60)" />
        <ellipse cx="110" cy="50" rx="22" ry="5" fill="rgba(255,255,255,0.08)" />
        <ellipse cx="165" cy="130" rx="16" ry="4" fill="rgba(255,255,255,0.06)" />
        <ellipse cx="60" cy="130" rx="20" ry="4" fill="rgba(255,255,255,0.07)" />
      </svg>

      {/* Specular highlight */}
      <div
        className="absolute rounded-full"
        style={{
          width: 80,
          height: 80,
          top: 20,
          left: 30,
          background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
        }}
      />
    </div>

    

    {/* Orbiting dot */}
    <div
      className="absolute"
      style={{
        width: 8,
        height: 8,
        background: "#FFFFFF",
        borderRadius: "50%",
        boxShadow: "0 0 12px #FFFFFF, 0 0 24px rgba(255,255,255,0.6)",
        top: "50%",
        left: "50%",
        marginLeft: -4,
        marginTop: -4,
        transformOrigin: "0 0",
        animation: "orbitDot 8s linear infinite",
      }}
    />
  </div>
);

const StatPill = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div
    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
    style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      backdropFilter: "blur(12px)",
      color: "#E2E8F0",
    }}
  >
    <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
    <span style={{ color: "#94A3B8" }}>{label}</span>
    <span className="font-semibold" style={{ color }}>{value}</span>
  </div>
);

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigate = useNavigate();

  const { signInWithGoogle, signInWithEmail, error, user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await signInWithGoogle();
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signInWithEmail(email, password);
    setIsLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          33% { transform: translateY(-12px) rotate(3deg); opacity: 1; }
          66% { transform: translateY(-6px) rotate(-2deg); opacity: 0.85; }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes rotateSlow {
          from { filter: brightness(1); }
          50% { filter: brightness(1.05); }
          to { filter: brightness(1); }
        }
        @keyframes scrollMap {
          from { background-position-x: 0px; }
          to { background-position-x: -400px; }
        }
        @keyframes orbitRing {
          from { transform: rotateX(75deg) rotateZ(0deg); }
          to { transform: rotateX(75deg) rotateZ(360deg); }
        }
        @keyframes orbitDot {
          from { transform: rotate(0deg) translateX(150px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
        .animate-fade-up {
          animation: fadeSlideUp 0.7s ease forwards;
        }
        .animate-fade-right {
          animation: fadeSlideRight 0.7s ease forwards;
        }
        .input-field {
          width: 100%;
          padding: 10px 14px;
          background: #F8FAFC;
          border: 1.5px solid rgba(15, 23, 42, 0.1);
          border-radius: 12px;
          font-size: 15px;
          color: #0F172A;
          outline: none;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }
        .input-field::placeholder { color: #94A3B8; }
        .input-field:focus {
          border-color: #16A34A;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.08);
        }
        .btn-primary {
          width: 100%;
          padding: 11px 24px;
          background: linear-gradient(135deg, #16A34A 0%, #15803D 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.01em;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #15803D 0%, #14532D 100%);
          box-shadow: 0 8px 24px rgba(22, 163, 74, 0.35);
          transform: translateY(-1px);
        }
        .btn-primary:active { transform: translateY(0); }
        .btn-google {
          width: 100%;
          padding: 10px 24px;
          background: #ffffff;
          color: #0F172A;
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: 'Inter', sans-serif;
        }
        .btn-google:hover {
          background: #F8FAFC;
          border-color: rgba(15, 23, 42, 0.2);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spinLoader 0.7s linear infinite;
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        className="w-screen h-screen flex overflow-hidden"
        style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC" }}
      >
        {/* LEFT PANEL */}
        <div
          className="relative flex flex-col justify-between overflow-hidden"
          style={{
            width: "52%",
            minWidth: 580,
            background: "linear-gradient(155deg, #0F172A 0%, #0a1628 40%, #071a10 100%)",
          }}
        >
          {/* Background mesh */}
          <div className="absolute inset-0" style={{ opacity: 0.4 }}>
            <div
              className="absolute rounded-full"
              style={{
                width: 600,
                height: 600,
                top: -200,
                left: -150,
                background: "radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 60%)",
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: 400,
                height: 400,
                bottom: -100,
                right: -100,
                background: "radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 60%)",
              }}
            />
            <div
              className="absolute"
              style={{
                inset: 0,
                backgroundImage: `radial-gradient(rgba(74,222,128,0.06) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Logo top-left */}
          <div
            className="relative z-10 flex items-center gap-3 px-12 pt-10"
            style={{ animation: mounted ? "fadeSlideUp 0.6s ease forwards" : "none", opacity: 0, animationDelay: "0.1s" }}
          >
            <div
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 40,
                height: 40,
                background: "linear-gradient(135deg, #16A34A, #4ADE80)",
                boxShadow: "0 4px 16px rgba(74, 222, 128, 0.3)",
              }}
            >
              <Leaf size={20} color="white" strokeWidth={2} />
            </div>
            <div>
              <div className="text-white font-semibold text-base tracking-tight">EcoTrack AI</div>
              <div className="text-xs" style={{ color: "#4ADE80", letterSpacing: "0.08em" }}>CARBON INTELLIGENCE</div>
            </div>
          </div>

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12">
            {/* Floating icons */}
            <FloatingIcon icon={Leaf} style={{ top: "18%", left: "8%" }} delay="0s" size={18} />
            <FloatingIcon icon={Wind} style={{ top: "22%", right: "12%" }} delay="1.5s" size={16} color="#86EFAC" />
            <FloatingIcon icon={Droplets} style={{ bottom: "28%", left: "6%" }} delay="3s" size={16} color="#67E8F9" />
            <FloatingIcon icon={TreePine} style={{ bottom: "22%", right: "8%" }} delay="2s" size={18} color="#4ADE80" />
            <FloatingIcon icon={Zap} style={{ top: "42%", left: "4%" }} delay="4s" size={14} color="#FCD34D" />

            {/* Earth illustration */}
            <div
              style={{
                animation: mounted ? "fadeSlideUp 0.8s ease forwards" : "none",
                opacity: 0,
                animationDelay: "0.3s",
                marginBottom: 40,
              }}
            >
              <EarthSVG />
            </div>

            {/* Headline */}
            <div
              className="text-center"
              style={{
                animation: mounted ? "fadeSlideUp 0.8s ease forwards" : "none",
                opacity: 0,
                animationDelay: "0.5s",
              }}
            >
              <h1
                className="font-bold leading-tight mb-4"
                style={{
                  fontSize: 32,
                  color: "#F8FAFC",
                  letterSpacing: "-0.02em",
                  maxWidth: 440,
                }}
              >
                Track Every Action.{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #4ADE80, #22C55E)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Reduce Every Emission.
                </span>
              </h1>
              <p className="text-base leading-relaxed" style={{ color: "#94A3B8", maxWidth: 380, margin: "0 auto" }}>
                Monitor your daily carbon footprint with real-time AI-powered insights and actionable recommendations.
              </p>
            </div>

            {/* Stats pills */}
            <div
              className="flex flex-wrap gap-3 justify-center mt-8"
              style={{
                animation: mounted ? "fadeSlideUp 0.8s ease forwards" : "none",
                opacity: 0,
                animationDelay: "0.7s",
              }}
            >
              <StatPill label="CO₂ Tracked" value="2.4M tons" color="#4ADE80" />
              <StatPill label="Users Active" value="128K" color="#22C55E" />
              <StatPill label="Reduction Avg" value="34%" color="#86EFAC" />
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="relative z-10 flex items-center gap-6 px-12 pb-10"
            style={{
              animation: mounted ? "fadeSlideUp 0.6s ease forwards" : "none",
              opacity: 0,
              animationDelay: "0.9s",
            }}
          >
            {[
              { icon: Shield, label: "SOC 2 Type II" },
              { icon: Globe, label: "170+ Countries" },
              { icon: Zap, label: "Real-time AI" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={14} style={{ color: "#4ADE80" }} strokeWidth={1.5} />
                <span className="text-xs" style={{ color: "#64748B" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div
          className="flex-1 flex justify-center px-12 py-2 overflow-hidden"
          style={{ background: "#F8FAFC" }}
        >
          {/* Glass card */}
          <div
            className="w-full mt-1"
            style={{
              maxWidth: 440,
              background: "#ffffff",
              borderRadius: 24,
              padding: "14px 28px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 24px 64px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.06)",
              animation: mounted ? "fadeSlideUp 0.7s ease forwards" : "none",
              opacity: 0,
              animationDelay: "0.2s",
            }}
          >
            {/* Card header */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: 40,
                    height: 40,
                    background: "linear-gradient(135deg, #16A34A, #4ADE80)",
                    boxShadow: "0 4px 16px rgba(74,222,128,0.3)",
                  }}
                >
                  <Leaf size={22} color="white" strokeWidth={2} />
                </div>
                <div>
                  <div className="font-bold text-lg tracking-tight" style={{ color: "#0F172A", letterSpacing: "-0.02em" }}>
                    EcoTrack AI
                  </div>
                  <div className="text-xs font-medium" style={{ color: "#16A34A" }}>Carbon Intelligence Platform</div>
                </div>
              </div>

              <h2 className="font-bold mb-2" style={{ fontSize: 20, color: "#0F172A", letterSpacing: "-0.025em" }}>
                Welcome back
              </h2>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Sign in to your account to continue tracking.
              </p>
            </div>

            {/* Google SSO */}
            <button className="btn-google mb-4" onClick={handleGoogleLogin} disabled={isLoading} type="button">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "rgba(15,23,42,0.08)" }} />
              <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>or sign in with email</span>
              <div className="flex-1 h-px" style={{ background: "rgba(15,23,42,0.08)" }} />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#374151", fontSize: 13, letterSpacing: "-0.01em" }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="block text-sm font-medium"
                    style={{ color: "#374151", fontSize: 13, letterSpacing: "-0.01em" }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium transition-colors"
                    style={{ color: "#16A34A", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#15803D")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#16A34A")}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94A3B8",
                      padding: 0,
                      display: "flex",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#64748B")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="relative flex-shrink-0 rounded-md transition-all duration-200"
                  style={{
                    width: 20,
                    height: 20,
                    background: rememberMe ? "#16A34A" : "#ffffff",
                    border: rememberMe ? "2px solid #16A34A" : "2px solid rgba(15,23,42,0.15)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: rememberMe ? "0 0 0 3px rgba(22,163,74,0.1)" : "none",
                    padding: 0,
                  }}
                >
                  {rememberMe && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <label
                  className="text-sm cursor-pointer select-none"
                  style={{ color: "#374151" }}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Remember me for 30 days
                </label>
              </div>
              
              {error && (
              <p className="text-xs mb-3 text-center" style={{ color: "#EF4444" }}>
                 {error}
              </p>
              )}

              {/* Login CTA */}
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    Sign in to EcoTrack
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-sm mt-4" style={{ color: "#64748B" }}>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-semibold transition-colors"
                style={{ color: "#16A34A", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#15803D")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#16A34A")}
              >
                Start for free
              </button>
            </p>

            {/* Trust badges */}
            <div
              className="flex items-center justify-center gap-3 mt-3 pt-3"
              style={{ borderTop: "1px solid rgba(15,23,42,0.06)" }}
            >
              {[
                { icon: Shield, text: "SOC 2" },
                { icon: Globe, text: "GDPR" },
                { icon: Leaf, text: "Carbon Neutral" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon size={12} style={{ color: "#16A34A" }} strokeWidth={1.5} />
                  <span className="text-xs" style={{ color: "#94A3B8" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}