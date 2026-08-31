jest.mock("@google/genai", () => {
  const generateContent = jest.fn();
  return {
    __esModule: true,
    GoogleGenAI: jest.fn().mockImplementation(() => ({ models: { generateContent } })),
    __mockGenerateContent: generateContent,
  };
});

import { __mockGenerateContent as mockGenerateContent } from "@google/genai";
import { generateGreenTip, askGreenAI } from "../services/geminiAPI";

describe("generateGreenTip", () => {
  beforeEach(() => mockGenerateContent.mockReset());

  test("returns trimmed tip text from a successful Gemini response", async () => {
    mockGenerateContent.mockResolvedValue({ text: "  Take the bus instead of driving today.  " });
    const tip = await generateGreenTip("travel", "car", 20, 3.84, { city: "Chennai" });
    expect(tip).toBe("Take the bus instead of driving today.");
  });

  test("falls back to a generic tip when the API call throws", async () => {
    mockGenerateContent.mockRejectedValue(new Error("network error"));
    const tip = await generateGreenTip("travel", "car", 20, 3.84, {});
    expect(tip).toBe("Try reducing one carbon-heavy activity today!");
  });

  test("calls generateContent with the gemini-3.6-flash model", async () => {
    mockGenerateContent.mockResolvedValue({ text: "tip" });
    await generateGreenTip("food", "beef", 1, 6.61, { dietType: "non-veg" });
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-3.6-flash" })
    );
  });
});

describe("askGreenAI", () => {
  beforeEach(() => mockGenerateContent.mockReset());

  test("returns trimmed answer text", async () => {
    mockGenerateContent.mockResolvedValue({ text: "  Try composting food scraps.  " });
    const answer = await askGreenAI("How do I reduce food waste?");
    expect(answer).toBe("Try composting food scraps.");
  });

  test("falls back to an error message when the API call throws", async () => {
    mockGenerateContent.mockRejectedValue(new Error("rate limited"));
    const answer = await askGreenAI("test question");
    expect(answer).toBe("Sorry, I couldn't process that right now — please try again.");
  });
});