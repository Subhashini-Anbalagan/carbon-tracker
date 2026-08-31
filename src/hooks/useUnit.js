import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

// Reads users/{uid}.unit in realtime — the same field Settings saves to.
// Falls back to "kg" until a custom unit is saved.
export const useUnit = (uid) => {
  const [unit, setUnit] = useState("kg");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setUnit("kg");
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        const data = snap.data();
        setUnit(data?.unit === "lbs" || data?.unit === "tonnes" ? data.unit : "kg");
        setLoading(false);
      },
      (err) => {
        console.error("useUnit snapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  return { unit, loading };
};