// Converts a kg value into the user's chosen display unit and formats it.
// kg is always the storage unit in Firestore — this only changes what's shown.
export const convertFromKg = (kg, unit) => {
  if (unit === "lbs") return kg * 2.20462;
  if (unit === "tonnes") return kg / 1000;
  return kg;
};

export const unitLabel = (unit) => {
  if (unit === "lbs") return "lbs";
  if (unit === "tonnes") return "t";
  return "kg";
};

// Returns just the number, rounded — use with unitLabel(unit) separately
// when you need the value and label in different spots.
export const formatCarbonValue = (kg, unit, decimals = 1) => {
  const val = convertFromKg(kg, unit);
  return val.toFixed(unit === "tonnes" ? 2 : decimals);
};

// Returns "12.3 kg" / "27.1 lbs" / "0.01 t" as one string.
export const formatCarbon = (kg, unit, decimals = 1) =>
  `${formatCarbonValue(kg, unit, decimals)} ${unitLabel(unit)}`;