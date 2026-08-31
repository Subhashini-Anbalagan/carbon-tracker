import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

// Reads users/{uid}.displayName in realtime, falling back to the
// Firebase Auth name until a custom one has been saved in Settings.
export const useProfileName = (uid, authDisplayName) => {
  const [name, setName] = useState(authDisplayName || "");

  useEffect(() => {
    if (!uid) {
      setName(authDisplayName || "");
      return;
    }
    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        const data = snap.data();
        setName(data?.displayName || authDisplayName || "");
      },
      (err) => console.error("useProfileName snapshot error:", err)
    );
    return () => unsubscribe();
  }, [uid, authDisplayName]);

  return name;
};