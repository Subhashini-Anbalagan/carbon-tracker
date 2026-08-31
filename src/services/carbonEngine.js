import {
  TRAVEL_EMISSION_FACTORS,
  FOOD_EMISSION_FACTORS,
  ELECTRICITY_EMISSION_FACTOR,
} from "../constants/emissionFactors";

/**
 * Calculates CO2 emissions in kg for a single logged action.
 * @param {"travel"|"food"|"electricity"} category
 * @param {string} subType - e.g. "car", "scooty", "beef", "vegan" (ignored for electricity)
 * @param {number} value - km for travel, servings for food, kWh for electricity
 * @returns {number} carbon in kg, rounded to 3 decimal places
 */
export const calculateCarbon = (category, subType, value) => {
  const numValue = parseFloat(value) || 0;
  let factor = 0;

  if (category === "travel") {
    factor = TRAVEL_EMISSION_FACTORS[subType] ?? 0;
  } else if (category === "food") {
    factor = FOOD_EMISSION_FACTORS[subType] ?? 0;
  } else if (category === "electricity") {
    factor = ELECTRICITY_EMISSION_FACTOR;
  }

  return +(numValue * factor).toFixed(3);
};