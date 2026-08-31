import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

const DAILY_TARGET = 15;

// Computes Best day, Worst day, monthly average, and days-under-target
// from users/{uid}/dailyScores for the current month.
// Only counts days that actually have logged activity (total > 0).
export const useMonthStats = (uid) => {
  const [stats, setStats] = useState({
    bestDay: null, worstDay: null, average: 0, daysUnderTarget: 0, daysLogged: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setStats({ bestDay: null, worstDay: null, average: 0, daysUnderTarget: 0, daysLogged: 0 });
      setLoading(false);
      return;
    }

    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const scoresRef = collection(db, "users", uid, "dailyScores");
    const q = query(
      scoresRef,
      where("date", ">=", `${monthPrefix}-01`),
      where("date", "<=", `${monthPrefix}-31`)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const days = snap.docs
          .map((d) => ({ date: d.data().date, total: +(d.data().totalCarbon || 0).toFixed(2) }))
          .filter((d) => d.total > 0);

        if (days.length === 0) {
          setStats({ bestDay: null, worstDay: null, average: 0, daysUnderTarget: 0, daysLogged: 0 });
          setLoading(false);
          return;
        }

        const sorted = [...days].sort((a, b) => a.total - b.total);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        const sum = days.reduce((s, d) => s + d.total, 0);
        const average = +(sum / days.length).toFixed(2);
        const daysUnderTarget = days.filter((d) => d.total <= DAILY_TARGET).length;

        setStats({ bestDay: best, worstDay: worst, average, daysUnderTarget, daysLogged: days.length });
        setLoading(false);
      },
      (err) => {
        console.error("useMonthStats snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { stats, loading };
};