import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

const DAILY_TARGET = 15; // same daily budget used app-wide

const toDateStr = (d) => d.toISOString().split("T")[0];

// Aggregates users/{uid}/dailyScores into the last 6 calendar months
// (including the current, in-progress month). Months with no logged
// activity still show as 0 rather than being skipped.
export const useMonthlyTrend = (uid) => {
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setMonthly([]);
      setLoading(false);
      return;
    }

    const today = new Date();
    const rangeStart = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const startStr = toDateStr(rangeStart);

    const scoresRef = collection(db, "users", uid, "dailyScores");
    const q = query(scoresRef, where("date", ">=", startStr), orderBy("date", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
          months.push({
            key,
            month: d.toLocaleDateString("en-US", { month: "short" }),
            co2: 0,
            target: +(DAILY_TARGET * daysInMonth).toFixed(0),
          });
        }

        snap.docs.forEach((doc) => {
          const data = doc.data();
          const key = data.date?.slice(0, 7); // "YYYY-MM"
          const bucket = months.find((m) => m.key === key);
          if (bucket) bucket.co2 += data.totalCarbon || 0;
        });

        setMonthly(months.map((m) => ({ ...m, co2: +m.co2.toFixed(2) })));
        setLoading(false);
      },
      (err) => {
        console.error("useMonthlyTrend snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { monthly, loading };
};