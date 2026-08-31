import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

// Aggregates the current month's users/{uid}/dailyScores into calendar
// weeks (W1, W2, ...), each capped to the days that actually fall in this
// month. Realtime via onSnapshot. Powers the Weekly Breakdown chart on
// Reports.tsx.
export const useWeeklyBreakdown = (uid, dailyTarget = 15) => {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setWeeks([]);
      setLoading(false);
      return;
    }

    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const scoresRef = collection(db, "users", uid, "dailyScores");
    const q = query(
      scoresRef,
      where("date", ">=", `${monthPrefix}-01`),
      where("date", "<=", `${monthPrefix}-31`),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const byDate = {};
        snap.docs.forEach((d) => {
          byDate[d.data().date] = +(d.data().totalCarbon || 0).toFixed(2);
        });

        const buckets = [];
        for (let day = 1; day <= daysInMonth; day += 7) {
          const weekDays = Math.min(7, daysInMonth - day + 1);
          let co2 = 0;
          for (let i = 0; i < weekDays; i++) {
            const dateStr = `${monthPrefix}-${String(day + i).padStart(2, "0")}`;
            co2 += byDate[dateStr] || 0;
          }
          buckets.push({
            week: `W${buckets.length + 1}`,
            co2: +co2.toFixed(2),
            target: +(dailyTarget * weekDays).toFixed(0),
          });
        }

        setWeeks(buckets);
        setLoading(false);
      },
      (err) => {
        console.error("useWeeklyBreakdown snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, dailyTarget]);

  return { weeks, loading };
};