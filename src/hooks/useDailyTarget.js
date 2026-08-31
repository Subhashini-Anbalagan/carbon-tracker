import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

// Reads users/{uid}.dailyTarget in realtime — the same field Settings
// already saves to. Falls back to 15 kg until a custom target is saved.
export const useDailyTarget = (uid) => {
  const [dailyTarget, setDailyTarget] = useState(15);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setDailyTarget(15);
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        const data = snap.data();
        setDailyTarget(typeof data?.dailyTarget === "number" ? data.dailyTarget : 15);
        setLoading(false);
      },
      (err) => {
        console.error("useDailyTarget snapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  return { dailyTarget, loading };
};