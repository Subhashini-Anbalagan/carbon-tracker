import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

// Sums this month's travel/food/electricity carbon from users/{uid}/dailyScores.
// Realtime — updates live as new actions are logged. Powers CategoryPieChart.tsx.
export const useCategoryTotals = (uid) => {
  const [totals, setTotals] = useState({ travel: 0, food: 0, electricity: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setTotals({ travel: 0, food: 0, electricity: 0, total: 0 });
      setLoading(false);
      return;
    }

    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // dailyScores doc IDs / "date" field are "YYYY-MM-DD" strings, so a
    // simple string range over the current month works without an index
    const scoresRef = collection(db, "users", uid, "dailyScores");
    const q = query(
      scoresRef,
      where("date", ">=", `${monthPrefix}-01`),
      where("date", "<=", `${monthPrefix}-31`)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let travel = 0, food = 0, electricity = 0;
        snap.docs.forEach((d) => {
          const data = d.data();
          travel += data.travelCarbon || 0;
          food += data.foodCarbon || 0;
          electricity += data.electricityCarbon || 0;
        });
        const total = travel + food + electricity;
        setTotals({
          travel: +travel.toFixed(2),
          food: +food.toFixed(2),
          electricity: +electricity.toFixed(2),
          total: +total.toFixed(2),
        });
        setLoading(false);
      },
      (err) => {
        console.error("useCategoryTotals snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { totals, loading };
};