// Emission factors matched to the categories actually used in ActivityLogger.tsx
// Formula: CO2 (kg) = Activity Value x Emission Factor

export const TRAVEL_EMISSION_FACTORS = {
  car: 0.192,
  scooty: 0.075,
  bus: 0.089,
  train: 0.041,
  plane: 0.255,
  bike: 0,   // bicycle - zero emission
};

export const FOOD_EMISSION_FACTORS = {
  beef: 6.61,
  chicken: 2.33,
  fish: 1.96,
  vegetarian: 0.87,
  vegan: 0.42,
  coffee: 0.21,
};

export const ELECTRICITY_EMISSION_FACTOR = 0.82; // kg CO2 per kWh (TNEB grid)