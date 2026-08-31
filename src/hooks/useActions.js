import { useState } from "react";
import { collection, addDoc, doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "../services/firebase";
import { generateGreenTip } from "../services/geminiAPI";

// Returns today's date as "YYYY-MM-DD" — used as the dailyScores document ID
const getTodayDateString = () => new Date().toISOString().split("T")[0];

// Saves one logged action to Firestore under users/{uid}/actions/{actionId}
export const useActions = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const addAction = async (uid, category, subType, value, carbonKg) => {
    setSaving(true);
    setError(null);
    try {
      const actionsRef = collection(db, "users", uid, "actions");
      const docRef = await addDoc(actionsRef, {
        category,      // "travel" | "food" | "electricity"
        subType,       // e.g. "car", "chicken", null for electricity
        value,         // km, servings, or kWh entered by the user
        carbonKg,      // result from calculateCarbon()
        geminiTip: "", // filled in moments later by attachGeminiTip — not blocking the save
        loggedAt: serverTimestamp(),
      });

      await updateDailyScore(uid, category, carbonKg);

      // Runs in the background — the user sees "Saved!" immediately instead
      // of waiting for the Gemini API round-trip
      attachGeminiTip(uid, docRef.id, category, subType, value, carbonKg);

      return docRef.id;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Generates the AI tip after the action is already saved, then patches
  // it onto the same doc. useTipFeed only shows entries with a non-empty
  // geminiTip, so the tip simply appears a moment later — no blocking.
  const attachGeminiTip = async (uid, actionId, category, subType, value, carbonKg) => {
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      const profile = userSnap.exists() ? userSnap.data() : {};
      const geminiTip = await generateGreenTip(category, subType, value, carbonKg, profile);
      await updateDoc(doc(db, "users", uid, "actions", actionId), { geminiTip });
    } catch (err) {
      console.error("Failed to attach Gemini tip:", err);
    }
  };

  // Rolls up today's action into users/{uid}/dailyScores/{YYYY-MM-DD}
  const updateDailyScore = async (uid, category, carbonKg) => {
    const dateStr = getTodayDateString();
    const scoreRef = doc(db, "users", uid, "dailyScores", dateStr);
    const categoryField =
      category === "travel" ? "travelCarbon" :
      category === "food" ? "foodCarbon" : "electricityCarbon";

    try {
      await setDoc(
        scoreRef,
        {
          date: dateStr,
          [categoryField]: increment(carbonKg),
          totalCarbon: increment(carbonKg),
          tipCount: increment(1),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Failed to update daily score:", err);
    }
  };

  return { addAction, saving, error };
};