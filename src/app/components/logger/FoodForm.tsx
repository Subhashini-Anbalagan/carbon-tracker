import { Utensils, Beef, Salad, Coffee, Apple } from "lucide-react";

export const mealTypes = [
  { id: "beef", label: "Beef-based meal", icon: Beef, co2PerServing: 6.61, color: "#EF4444" },
  { id: "chicken", label: "Chicken meal", icon: Utensils, co2PerServing: 2.33, color: "#F59E0B" },
  { id: "fish", label: "Fish meal", icon: Utensils, co2PerServing: 1.96, color: "#3B82F6" },
  { id: "vegetarian", label: "Vegetarian meal", icon: Salad, co2PerServing: 0.87, color: "#22C55E" },
  { id: "vegan", label: "Vegan meal", icon: Apple, co2PerServing: 0.42, color: "#16A34A" },
  { id: "coffee", label: "Coffee / Tea", icon: Coffee, co2PerServing: 0.21, color: "#92400E" },
];

type FoodFormProps = {
  meal: typeof mealTypes[number];
  setMeal: (m: typeof mealTypes[number]) => void;
  quantity: string;
  setQuantity: (v: string) => void;
};

export default function FoodForm({ meal, setMeal, quantity, setQuantity }: FoodFormProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "rgba(245,158,11,0.1)" }}>
          <Utensils size={17} style={{ color: "#F59E0B" }} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="font-semibold text-sm" style={{ color: "#0F172A" }}>Log Food Intake</h2>
          <p className="text-xs" style={{ color: "#94A3B8" }}>Track the carbon cost of your meals</p>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold mb-3" style={{ color: "#374151" }}>Meal Type</label>
        <div className="grid grid-cols-3 gap-2.5">
          {mealTypes.map((m) => {
            const Icon = m.icon;
            const sel = meal.id === m.id;
            return (
              <button type="button" key={m.id} onClick={() => setMeal(m)}
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150"
                style={{
                  background: sel ? `${m.color}08` : "#F8FAFC",
                  border: `1.5px solid ${sel ? m.color : "rgba(15,23,42,0.07)"}`,
                  cursor: "pointer",
                  boxShadow: sel ? `0 0 0 3px ${m.color}18` : "none",
                }}>
                <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 32, height: 32, background: sel ? `${m.color}15` : "rgba(15,23,42,0.04)" }}>
                  <Icon size={15} style={{ color: sel ? m.color : "#94A3B8" }} strokeWidth={1.8} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold" style={{ color: sel ? "#0F172A" : "#475569" }}>{m.label}</div>
                  <div className="text-xs" style={{ color: m.color, fontWeight: 600 }}>{m.co2PerServing} kg CO₂</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Servings / Quantity</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQuantity(String(Math.max(1, parseInt(quantity) - 1)))}
            className="flex items-center justify-center rounded-xl transition-all"
            style={{ width: 40, height: 40, background: "#F8FAFC", border: "1.5px solid rgba(15,23,42,0.09)", cursor: "pointer", fontSize: 18, color: "#0F172A" }}>−</button>
          <input type="number" min="1" max="20" value={quantity} onChange={(e) => setQuantity(e.target.value)}
            className="field-input text-center font-semibold" style={{ maxWidth: 80, textAlign: "center" }} />
          <button type="button" onClick={() => setQuantity(String(Math.min(20, parseInt(quantity) + 1)))}
            className="flex items-center justify-center rounded-xl transition-all"
            style={{ width: 40, height: 40, background: "#F8FAFC", border: "1.5px solid rgba(15,23,42,0.09)", cursor: "pointer", fontSize: 18, color: "#0F172A" }}>+</button>
          <span className="text-sm" style={{ color: "#94A3B8" }}>serving{parseInt(quantity) !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}