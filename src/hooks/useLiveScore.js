import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

// Returns today's date as "YYYY-MM-DD" — same format useActions.js uses as the doc ID
const getTodayDateString = () => new Date().toISOString().split("T")[0];

// Listens to users/{uid}/dailyScores/{today} in realtime.
// Fires instantly whenever useActions.js writes a new action today —
// no manual refresh needed, powers the live ticker + globe.
export const useLiveScore = (uid) => {
  const [totalCarbon, setTotalCarbon] = useState(0);
  const [breakdown, setBreakdown] = useState({
    travelCarbon: 0,
    foodCarbon: 0,
    electricityCarbon: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setTotalCarbon(0);
      setBreakdown({ travelCarbon: 0, foodCarbon: 0, electricityCarbon: 0 });
      setLoading(false);
      return;
    }

    const dateStr = getTodayDateString();
    const scoreRef = doc(db, "users", uid, "dailyScores", dateStr);

    const unsubscribe = onSnapshot(
      scoreRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setTotalCarbon(data.totalCarbon || 0);
          setBreakdown({
            travelCarbon: data.travelCarbon || 0,
            foodCarbon: data.foodCarbon || 0,
            electricityCarbon: data.electricityCarbon || 0,
          });
        } else {
          setTotalCarbon(0);
          setBreakdown({ travelCarbon: 0, foodCarbon: 0, electricityCarbon: 0 });
        }
        setLoading(false);
      },
      (err) => {
        console.error("useLiveScore snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { totalCarbon, breakdown, loading };
};