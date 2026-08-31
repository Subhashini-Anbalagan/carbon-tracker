import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { transportModes } from "../app/components/logger/TravelForm";
import { mealTypes } from "../app/components/logger/FoodForm";
import { applianceOptions } from "../app/components/logger/ElectricityForm";
import { Zap } from "lucide-react";

const findMeta = (category, subType) => {
  if (category === "travel") return transportModes.find((m) => m.id === subType);
  if (category === "food") return mealTypes.find((m) => m.id === subType);
  if (category === "electricity") return applianceOptions.find((m) => m.id === subType);
  return null;
};

const formatTime = (loggedAt) => {
  if (!loggedAt?.toDate) return "Just now";
  const d = loggedAt.toDate();
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`;
};

// Reads the most recent logged actions from users/{uid}/actions in
// realtime, mapping each raw Firestore doc into the display shape the
// Recent Activities list / Today's Summary expect. Replaces the old
// hardcoded recentActivities seed array on ActivityLogger.tsx.
export const useRecentActions = (uid, take = 20) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const actionsRef = collection(db, "users", uid, "actions");
    const q = query(actionsRef, orderBy("loggedAt", "desc"), limit(take));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          const meta = findMeta(data.category, data.subType);
          const label =
            data.category === "travel" ? `${meta?.label || data.subType} — ${data.value} km` :
            data.category === "food" ? `${meta?.label || data.subType} × ${data.value}` :
            `${meta?.label || data.subType} — ${data.value} kWh`;
          const sub =
            data.category === "travel" ? "Travel entry" :
            data.category === "food" ? "Food entry" : "Electricity entry";

          return {
            id: d.id,
            type: data.category,
            icon: meta?.icon || Zap,
            label,
            sub,
            time: formatTime(data.loggedAt),
            co2: +(data.carbonKg || 0).toFixed(2),
            color: meta?.color || "#8B5CF6",
            delta: data.carbonKg > 4 ? "high" : data.carbonKg > 2 ? "medium" : "low",
          };
        });
        setActivities(items);
        setLoading(false);
      },
      (err) => {
        console.error("useRecentActions snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, take]);

  return { activities, loading };
};