import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

const toDateStr = (d) => d.toISOString().split("T")[0];

// Returns a continuous 30-day series (including today) of totalCarbon from
// users/{uid}/dailyScores, filling days with no logged actions as 0.
// Also computes a running average up to each day. Realtime via onSnapshot.
export const useTrend30Days = (uid) => {
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setTrend([]);
      setLoading(false);
      return;
    }

    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    const startStr = toDateStr(start);

    const scoresRef = collection(db, "users", uid, "dailyScores");
    const q = query(scoresRef, where("date", ">=", startStr), orderBy("date", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const byDate = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          byDate[data.date] = +(data.totalCarbon || 0).toFixed(2);
        });

        const days = [];
        let runningSum = 0;
        for (let i = 0; i < 30; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const dateStr = toDateStr(d);
          const actual = byDate[dateStr] || 0;
          runningSum += actual;
          days.push({
            day: i + 1,
            label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            date: dateStr,
            actual,
            avg: +(runningSum / (i + 1)).toFixed(2),
          });
        }

        setTrend(days);
        setLoading(false);
      },
      (err) => {
        console.error("useTrend30Days snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { trend, loading };
};