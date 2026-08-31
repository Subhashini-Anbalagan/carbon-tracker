import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";

// Low-carbon subtypes count as "green" elements for the City Builder;
// everything else in that category counts as pollution. Electricity has
// no subType, so it's judged by carbonKg against a low-usage threshold.
const GREEN_TRAVEL = new Set(["bike", "train", "bus"]);
const GREEN_FOOD = new Set(["vegetarian", "vegan"]);
const ELECTRICITY_GREEN_THRESHOLD = 3; // kg CO2 — below this counts as low-usage

const isGreenAction = (category, subType, carbonKg) => {
  if (category === "travel") return GREEN_TRAVEL.has(subType);
  if (category === "food") return GREEN_FOOD.has(subType);
  if (category === "electricity") return carbonKg < ELECTRICITY_GREEN_THRESHOLD;
  return false;
};

// Display label for each green subType, shown in the "top habit" callout
const HABIT_LABELS = {
  "travel:bike": "Bike trips 🚲",
  "travel:train": "Train rides 🚆",
  "travel:bus": "Bus rides 🚌",
  "food:vegetarian": "Veg meals 🥗",
  "food:vegan": "Vegan meals 🌱",
  "electricity:low": "Low electricity days ⚡",
};

// Reads the last 7 days of actions from users/{uid}/actions and classifies
// each as a "green building" (park, tree, solar panel, cycle lane) or a
// "pollution element" (smog, factory, traffic) for CityBuilder.tsx.
// Realtime via onSnapshot — same pattern as useWeekScores.
export const useCityElements = (uid) => {
  const [greenCount, setGreenCount] = useState(0);
  const [badCount, setBadCount] = useState(0);
  const [topHabit, setTopHabit] = useState(null);
  const [weekWeather, setWeekWeather] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setGreenCount(0);
      setBadCount(0);
      setTopHabit(null);
      setWeekWeather([]);
      setLoading(false);
      return;
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const actionsRef = collection(db, "users", uid, "actions");
    const q = query(
      actionsRef,
      where("loggedAt", ">=", Timestamp.fromDate(sevenDaysAgo)),
      orderBy("loggedAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let green = 0;
        let bad = 0;
        const habitTally = {};

        // Bucket by calendar day (last 7 days, oldest first) for the weather strip
        const dayBuckets = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          dayBuckets[key] = { date: key, label: d.toLocaleDateString("en-US", { weekday: "short" }), green: 0, bad: 0 };
        }

        snap.docs.forEach((d) => {
          const { category, subType, carbonKg, loggedAt } = d.data();
          const isGreen = isGreenAction(category, subType, carbonKg);

          if (isGreen) {
            green++;
            const key = category === "electricity" ? "electricity:low" : `${category}:${subType}`;
            habitTally[key] = (habitTally[key] || 0) + 1;
          } else {
            bad++;
          }

          const dayKey = loggedAt?.toDate ? loggedAt.toDate().toISOString().slice(0, 10) : null;
          if (dayKey && dayBuckets[dayKey]) {
            if (isGreen) dayBuckets[dayKey].green++;
            else dayBuckets[dayKey].bad++;
          }
        });

        const topKey = Object.keys(habitTally).sort((a, b) => habitTally[b] - habitTally[a])[0];
        setTopHabit(topKey ? { label: HABIT_LABELS[topKey] || topKey, count: habitTally[topKey] } : null);

        setWeekWeather(Object.values(dayBuckets).map((day) => {
          const dayTotal = day.green + day.bad;
          const ratio = dayTotal > 0 ? day.green / dayTotal : null;
          const weather = ratio === null ? "none" : ratio >= 0.7 ? "sun" : ratio >= 0.4 ? "cloud" : "rain";
          return { ...day, weather };
        }));

        setGreenCount(green);
        setBadCount(bad);
        setLoading(false);
      },
      (err) => {
        console.error("useCityElements snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const total = greenCount + badCount;
  const health = total > 0 ? Math.round((greenCount / total) * 100) : 100;

  return { greenCount, badCount, health, topHabit, weekWeather, loading };
};