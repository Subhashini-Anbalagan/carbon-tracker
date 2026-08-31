import { Wind, Zap, Battery, Circle, Droplets, Flame, Home, Calendar } from "lucide-react";

export const applianceOptions = [
  { id: "fan", label: "Ceiling Fan", watts: 75, icon: Wind, color: "#06B6D4" },
  { id: "bulb", label: "LED Bulb", watts: 10, icon: Zap, color: "#F59E0B" },
  { id: "fridge", label: "Refrigerator", watts: 150, icon: Battery, color: "#3B82F6" },
  { id: "tv", label: "Television", watts: 120, icon: Circle, color: "#6366F1" },
  { id: "ac", label: "Air Conditioner", watts: 1500, icon: Wind, color: "#EF4444" },
  { id: "washing", label: "Washing Machine", watts: 500, icon: Droplets, color: "#8B5CF6" },
  { id: "geyser", label: "Water Heater", watts: 2000, icon: Flame, color: "#F97316" },
  { id: "mixer", label: "Mixer Grinder", watts: 750, icon: Home, color: "#16A34A" },
];

type ElectricityFormProps = {
  appliance: typeof applianceOptions[number];
  setAppliance: (a: typeof applianceOptions[number]) => void;
  hoursUsed: string;
  setHoursUsed: (v: string) => void;
  elecDate: string;
  setElecDate: (v: string) => void;
};

export default function ElectricityForm({ appliance, setAppliance, hoursUsed, setHoursUsed, elecDate, setElecDate }: ElectricityFormProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "rgba(139,92,246,0.1)" }}>
          <Zap size={17} style={{ color: "#8B5CF6" }} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="font-semibold text-sm" style={{ color: "#0F172A" }}>Log Electricity Usage</h2>
          <p className="text-xs" style={{ color: "#94A3B8" }}>Enter your consumed kilowatt-hours</p>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold mb-3" style={{ color: "#374151" }}>Appliance</label>
        <div className="grid grid-cols-4 gap-2">
          {applianceOptions.map((a) => {
            const Icon = a.icon;
            const sel = appliance.id === a.id;
            return (
              <button type="button" key={a.id} onClick={() => setAppliance(a)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-150 text-center"
                style={{
                  background: sel ? `${a.color}08` : "#F8FAFC",
                  border: `1.5px solid ${sel ? a.color : "rgba(15,23,42,0.07)"}`,
                  cursor: "pointer",
                  boxShadow: sel ? `0 0 0 3px ${a.color}18` : "none",
                }}>
                <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: sel ? `${a.color}15` : "rgba(15,23,42,0.04)" }}>
                  <Icon size={17} style={{ color: sel ? a.color : "#94A3B8" }} strokeWidth={1.8} />
                </div>
                <span className="text-xs font-medium leading-tight" style={{ color: sel ? "#0F172A" : "#64748B", fontSize: 10 }}>{a.label}</span>
                <span className="text-xs" style={{ color: sel ? a.color : "#94A3B8", fontSize: 9, fontWeight: sel ? 600 : 400 }}>{a.watts}W</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Hours Used</label>
          <div className="relative">
            <input type="number" min="0" step="0.5" value={hoursUsed} onChange={(e) => setHoursUsed(e.target.value)}
              placeholder="e.g. 3" className="field-input" style={{ paddingRight: 48 }} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: "#94A3B8" }}>hrs</span>
          </div>
          <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>
            ≈ {(((parseFloat(hoursUsed) || 0) * appliance.watts) / 1000).toFixed(2)} kWh · Grid average: 0.82 kg CO₂/kWh
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Date</label>
          <div className="relative">
            <input type="date" value={elecDate} onChange={(e) => setElecDate(e.target.value)} className="field-input" />
            <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#94A3B8" }} />
          </div>
        </div>
      </div>
    </div>
  );
}