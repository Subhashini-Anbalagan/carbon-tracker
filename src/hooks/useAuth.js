import { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../services/firebase";

// Creates users/{uid} in Firestore the first time someone logs in.
// Does nothing if the profile document already exists.
const ensureUserProfile = async (user) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    console.log("ensureUserProfile check:", user.uid, "exists:", userSnap.exists());
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || "",
        email: user.email || "",
        city: "",
        vehicleType: "",
        dietType: "",
        createdAt: serverTimestamp(),
        totalCarbonScore: 0,
      });
    }
  } catch (err) {
    console.error("Failed to create user profile:", err);
  }
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await ensureUserProfile(currentUser);
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    }
  };

  const signInWithEmail = async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (err) {
      setError(err.message);
    }
  };

  return { user, loading, error, signInWithGoogle, signInWithEmail, logout };
};