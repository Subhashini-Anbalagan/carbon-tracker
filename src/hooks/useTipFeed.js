import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

// Listens to the user's most recent actions in realtime and returns only
// the ones that have a Gemini tip attached — powers the Dashboard's
// AI insights feed (TipFeed.tsx).
export const useTipFeed = (uid, count = 5) => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setTips([]);
      setLoading(false);
      return;
    }

    // Fetch a bit more than we need (10) since some actions may not have
    // a tip yet (e.g. Gemini call failed and fell back silently), then
    // filter client-side and trim to the requested count.
    const actionsRef = collection(db, "users", uid, "actions");
    const q = query(actionsRef, orderBy("loggedAt", "desc"), limit(10));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const withTips = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => a.geminiTip && a.geminiTip.trim().length > 0)
          .slice(0, count);
        setTips(withTips);
        setLoading(false);
      },
      (err) => {
        console.error("useTipFeed snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, count]);

  return { tips, loading };
};