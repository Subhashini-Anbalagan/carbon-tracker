import { GoogleGenAI } from "@google/genai";

// Reads the key from .env — never hardcode it directly in this file
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const UNITS = { travel: "km", food: "serving(s)", electricity: "kWh" };

// Generates a short, personalized green tip based on the action just logged.
// Falls back to a generic tip if the API call fails for any reason
// (network issue, rate limit, missing key, etc.) so the app never breaks.
export const generateGreenTip = async (category, subType, value, carbonKg, userProfile) => {
  try {
    const prompt = `
A user in ${userProfile.city || "India"} just logged this exact action:
${value} ${UNITS[category] || ""} of "${subType}" (category: ${category}), producing ${carbonKg} kg CO2.
Their diet preference: ${userProfile.dietType || "not specified"}.
Their usual vehicle: ${userProfile.vehicleType || "not specified"}.

Give ONE green tip that is specific to this exact "${subType}" action — not generic advice.
Strict rules: one sentence only, under 25 words, no preamble, no markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Try reducing one carbon-heavy activity today!";
  }
};
// Free-form "Ask AI" box on the Dashboard — not tied to a logged action.
export const askGreenAI = async (question) => {
  try {
    const prompt = `
You are a friendly sustainability assistant inside a personal carbon-footprint tracker app.
Answer the user's question below with practical, eco-friendly advice.
Strict rules: 2-3 short sentences max, no markdown, no preamble.

Question: ${question}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API error (askGreenAI):", error);
    return "Sorry, I couldn't process that right now — please try again.";
  }
};