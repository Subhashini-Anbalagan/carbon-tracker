import { calculateCarbon } from "../services/carbonEngine";

describe("calculateCarbon", () => {
  // Travel
  test("car 20km returns 3.84 kg CO2", () => {
    expect(calculateCarbon("travel", "car", 20)).toBe(3.84);
  });

  test("bike (bicycle) 20km returns 0 kg CO2 — zero-emission", () => {
    expect(calculateCarbon("travel", "bike", 20)).toBe(0);
  });

  test("bus 10km returns 0.89 kg CO2", () => {
    expect(calculateCarbon("travel", "bus", 10)).toBe(0.89);
  });

  test("train 10km returns 0.41 kg CO2", () => {
    expect(calculateCarbon("travel", "train", 10)).toBe(0.41);
  });

  test("plane 100km returns 25.5 kg CO2", () => {
    expect(calculateCarbon("travel", "plane", 100)).toBe(25.5);
  });

  // Food
  test("1 beef meal returns 6.61 kg CO2", () => {
    expect(calculateCarbon("food", "beef", 1)).toBe(6.61);
  });

  test("1 vegetarian meal returns 0.87 kg CO2", () => {
    expect(calculateCarbon("food", "vegetarian", 1)).toBe(0.87);
  });

  test("1 vegan meal returns 0.42 kg CO2", () => {
    expect(calculateCarbon("food", "vegan", 1)).toBe(0.42);
  });

  // Electricity
  test("5 kWh electricity returns 4.1 kg CO2", () => {
    expect(calculateCarbon("electricity", null, 5)).toBe(4.1);
  });

  // Edge cases
  test("unknown subType returns 0", () => {
    expect(calculateCarbon("travel", "hoverboard", 20)).toBe(0);
  });

  test("non-numeric value returns 0", () => {
    expect(calculateCarbon("travel", "car", "abc")).toBe(0);
  });

  test("negative value returns negative carbon (no clamping in calculateCarbon)", () => {
    expect(calculateCarbon("travel", "car", -10)).toBe(-1.92);
  });
});