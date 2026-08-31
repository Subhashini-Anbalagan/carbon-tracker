import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

const toDateStr = (d) => d.toISOString().split("T")[0];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Returns this week (Mon-Sun, including today) of travel/food/electricity
// carbon from users/{uid}/dailyScores — one entry per day, 0 for days with
// nothing logged yet. Realtime via onSnapshot. Powers LiveBarChart.tsx.
export const useWeekScores = (uid) => {
  const [week, setWeek] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setWeek([]);
      setLoading(false);
      return;
    }

    const today = new Date();
    // Monday of the current week (treat Sunday as day 7, not day 0)
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1));
    const mondayStr = toDateStr(monday);

    const scoresRef = collection(db, "users", uid, "dailyScores");
    const q = query(scoresRef, where("date", ">=", mondayStr), orderBy("date", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const byDate = {};
        snap.docs.forEach((d) => {
          byDate[d.id] = d.data();
        });

        const days = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dateStr = toDateStr(d);
          const data = byDate[dateStr] || {};
          days.push({
            day: DAY_LABELS[d.getDay()],
            date: dateStr,
            travel: +(data.travelCarbon || 0).toFixed(2),
            food: +(data.foodCarbon || 0).toFixed(2),
            electricity: +(data.electricityCarbon || 0).toFixed(2),
          });
        }

        setWeek(days);
        setLoading(false);
      },
      (err) => {
        console.error("useWeekScores snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { week, loading };
};