import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bike, Salad, Sun, Sprout, Wind, CarFront, Beef, CloudFog,
  Lightbulb, ShoppingBag, Globe as GlobeIcon, Play, RotateCcw,
} from "lucide-react";
import "./EcoCatch.css";

const GREEN_ITEMS = [Bike, Salad, Sun, Sprout, Wind];
const RED_ITEMS = [CarFront, Beef, CloudFog, Lightbulb, ShoppingBag];

const ROUND_SECONDS = 60;
const SPAWN_MS = 800;
const BASE_FALL_MS = 4000;
const MIN_FALL_MS = 1500;
const HIGH_SCORE_KEY = "ecoCatchHighScore";

interface FallingItem {
  id: number;
  type: "green" | "red";
  Icon: any;
  left: number;
  fallMs: number;
}

const earthState = (health: number) =>
  health > 70 ? { color: "#16A34A" } :
  health > 40 ? { color: "#F59E0B" } :
  { color: "#EF4444" };

export const EcoCatch = () => {
  const [status, setStatus] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [flash, setFlash] = useState<"green" | "red" | null>(null);
  const [highScore, setHighScore] = useState(0);

  const nextId = useRef(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const stored = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    setHighScore(stored);
  }, []);

  const triggerFlash = (color: "green" | "red") => {
    setFlash(color);
    setTimeout(() => setFlash(null), 200);
  };

  const startGame = () => {
    setScore(0);
    setHealth(100);
    setTimeLeft(ROUND_SECONDS);
    setItems([]);
    elapsedRef.current = 0;
    setStatus("playing");
  };

  const endGame = useCallback((finalScore: number) => {
    setStatus("over");
    setItems([]);
    setHighScore((prev) => {
      if (finalScore > prev) {
        localStorage.setItem(HIGH_SCORE_KEY, String(finalScore));
        return finalScore;
      }
      return prev;
    });
  }, []);

  // Countdown
  useEffect(() => {
    if (status !== "playing") return;
    const timer = setInterval(() => {
      elapsedRef.current += 1;
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === "playing" && timeLeft === 0) {
      setScore((s) => { endGame(s); return s; });
    }
  }, [timeLeft, status, endGame]);

  useEffect(() => {
    if (status === "playing" && health <= 0) {
      setScore((s) => { endGame(s); return s; });
    }
  }, [health, status, endGame]);

  // Spawner — fall duration shortens every 15s to speed the round up
  useEffect(() => {
    if (status !== "playing") return;
    const spawner = setInterval(() => {
      const fallMs = Math.max(MIN_FALL_MS, BASE_FALL_MS - Math.floor(elapsedRef.current / 15) * 400);
      const isGreen = Math.random() < 0.6;
      const pool = isGreen ? GREEN_ITEMS : RED_ITEMS;
      const Icon = pool[Math.floor(Math.random() * pool.length)];
      setItems((prev) => [...prev, {
        id: nextId.current++,
        type: isGreen ? "green" : "red",
        Icon,
        left: 8 + Math.random() * 80,
        fallMs,
      }]);
    }, SPAWN_MS);
    return () => clearInterval(spawner);
  }, [status]);

  const catchItem = (item: FallingItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (item.type === "green") {
      setScore((s) => s + 10);
      triggerFlash("green");
    } else {
      setHealth((h) => Math.max(0, h - 10));
      triggerFlash("red");
    }
  };

  // Fires when an item's fall animation finishes uncaught. Caught items are
  // already removed (and unmounted) before this can fire for them.
  const missItem = (item: FallingItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (item.type === "green") {
      setHealth((h) => Math.max(0, h - 10));
    }
  };

  const earth = earthState(health);

  return (
    <div className="card report-section" style={{
      animationDelay: "0.35s", borderRadius: 20, padding: 20,
      background: "#ffffff", border: "1px solid rgba(15,23,42,0.07)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em" }}>Eco Catch</h3>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>High score: {highScore}</span>
      </div>
      <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>
        Catch the green items, dodge the red ones — 60 seconds on the clock
      </p>

      <div className="eco-catch-stage" style={{
        height: 180, borderRadius: 15,
        background: `${earth.color}08`, border: `1px solid ${earth.color}20`,
      }}>
        {flash && (
          <div className="eco-catch-flash" style={{
            background: flash === "green" ? "rgba(22,163,74,0.18)" : "rgba(239,68,68,0.18)",
          }} />
        )}

        {status !== "playing" && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 10, zIndex: 5,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: `${earth.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GlobeIcon size={20} style={{ color: earth.color }} />
            </div>
            {status === "over" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Round over — {score} pts</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                  {health <= 0 ? "Earth's health ran out" : "Time's up"}
                </div>
              </div>
            )}
            <button onClick={startGame} className="eco-catch-play-btn" style={{ background: `linear-gradient(135deg, ${earth.color}, ${earth.color}cc)` }}>
              {status === "idle" ? <Play size={13} /> : <RotateCcw size={13} />}
              {status === "idle" ? "Play" : "Play again"}
            </button>
          </div>
        )}

        {status === "playing" && items.map((item) => (
          <div
            key={item.id}
            onClick={() => catchItem(item)}
            onAnimationEnd={() => missItem(item)}
            className="eco-catch-item"
            style={{
              left: `${item.left}%`,
              animationDuration: `${item.fallMs}ms`,
              background: item.type === "green" ? "rgba(22,163,74,0.14)" : "rgba(239,68,68,0.12)",
              border: `1px solid ${item.type === "green" ? "#16A34A" : "#EF4444"}30`,
            }}
          >
            <item.Icon size={15} style={{ color: item.type === "green" ? "#16A34A" : "#EF4444" }} strokeWidth={1.8} />
          </div>
        ))}
      </div>

      {status === "playing" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 12, color: "#64748B" }}>Score <strong style={{ color: "#0F172A" }}>{score}</strong></span>
            <span style={{ fontSize: 12, color: "#64748B" }}>Time <strong style={{ color: "#0F172A" }}>{timeLeft}s</strong></span>
          </div>
          <div style={{ width: 100, height: 6, background: "rgba(15,23,42,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${health}%`, background: `linear-gradient(90deg, ${earth.color}, ${earth.color}aa)`, transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}
    </div>
  );
};