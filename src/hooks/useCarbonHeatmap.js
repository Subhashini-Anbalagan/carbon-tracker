import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

const toDateStr = (d) => d.toISOString().split("T")[0];

// Returns a 5-week (35-cell), Mon-first calendar grid ending on the Sunday
// of the current week, built from real users/{uid}/dailyScores. Days with
// no logged activity are 0; days after today are marked isFuture and never
// show a fabricated value. Realtime via onSnapshot. Powers the Carbon
// Heatmap on Analytics.tsx.
export const useCarbonHeatmap = (uid) => {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setCells([]);
      setLoading(false);
      return;
    }

    const today = new Date();
    const todayStr = toDateStr(today);
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Mon=1..Sun=7
    const currentWeekMonday = new Date(today);
    currentWeekMonday.setDate(today.getDate() - (dayOfWeek - 1));

    const gridStart = new Date(currentWeekMonday);
    gridStart.setDate(currentWeekMonday.getDate() - 28); // 4 more weeks back = 5 weeks total
    const startStr = toDateStr(gridStart);

    const scoresRef = collection(db, "users", uid, "dailyScores");
    const q = query(scoresRef, where("date", ">=", startStr), orderBy("date", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const byDate = {};
        snap.docs.forEach((d) => {
          byDate[d.id] = +(d.data().totalCarbon || 0).toFixed(2);
        });

        const days = [];
        for (let i = 0; i < 35; i++) {
          const d = new Date(gridStart);
          d.setDate(gridStart.getDate() + i);
          const dateStr = toDateStr(d);
          days.push({
            date: dateStr,
            label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            monthLabel: d.toLocaleDateString("en-US", { month: "short" }),
            value: dateStr > todayStr ? 0 : (byDate[dateStr] || 0),
            isFuture: dateStr > todayStr,
          });
        }

        setCells(days);
        setLoading(false);
      },
      (err) => {
        console.error("useCarbonHeatmap snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { cells, loading };
};