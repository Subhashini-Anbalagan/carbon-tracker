import { Car, Bus, Plane, Bike, Train, Calendar } from "lucide-react";

export const ScootyIcon = ({ size = 19, style, strokeWidth = 2 }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="6" cy="18" r="2.4" />
    <circle cx="17" cy="18" r="2.4" />
    <path d="M8.4 18h5.8" />
    <path d="M14.2 18l2.4-9.5" />
    <path d="M14.8 8.5h4" />
  </svg>
);

export const transportModes = [
  { id: "car", label: "Car (Petrol)", icon: Car, co2PerKm: 0.192, color: "#3B82F6" },
  { id: "scooty", label: "Scooty", icon: ScootyIcon, co2PerKm: 0.075, color: "#06B6D4" },
  { id: "bus", label: "Bus", icon: Bus, co2PerKm: 0.089, color: "#F59E0B" },
  { id: "train", label: "Train", icon: Train, co2PerKm: 0.041, color: "#8B5CF6" },
  { id: "plane", label: "Airplane", icon: Plane, co2PerKm: 0.255, color: "#EF4444" },
  { id: "bike", label: "Bicycle", icon: Bike, co2PerKm: 0, color: "#16A34A" },
];

type TravelFormProps = {
  transport: typeof transportModes[number];
  setTransport: (t: typeof transportModes[number]) => void;
  distance: string;
  setDistance: (v: string) => void;
  travelDate: string;
  setTravelDate: (v: string) => void;
};

export default function TravelForm({ transport, setTransport, distance, setDistance, travelDate, setTravelDate }: TravelFormProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "rgba(59,130,246,0.1)" }}>
          <Car size={17} style={{ color: "#3B82F6" }} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="font-semibold text-sm" style={{ color: "#0F172A" }}>Log Travel</h2>
          <p className="text-xs" style={{ color: "#94A3B8" }}>Choose your transport mode and distance</p>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold mb-3" style={{ color: "#374151", letterSpacing: "-0.005em" }}>Transport Mode</label>
        <div className="grid grid-cols-6 gap-2">
          {transportModes.map((mode) => {
            const Icon = mode.icon;
            const sel = transport.id === mode.id;
            return (
              <button type="button" key={mode.id} onClick={() => setTransport(mode)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-150 text-center"
                style={{
                  background: sel ? `${mode.color}08` : "#F8FAFC",
                  border: `1.5px solid ${sel ? mode.color : "rgba(15,23,42,0.07)"}`,
                  cursor: "pointer",
                  boxShadow: sel ? `0 0 0 3px ${mode.color}18` : "none",
                }}>
                <div className="flex items-center justify-center rounded-xl"
                  style={{ width: 36, height: 36, background: sel ? `${mode.color}15` : "rgba(15,23,42,0.04)" }}>
                  <Icon size={17} style={{ color: sel ? mode.color : "#94A3B8" }} strokeWidth={1.8} />
                </div>
                <span className="text-xs font-medium leading-tight" style={{ color: sel ? "#0F172A" : "#64748B", fontSize: 10 }}>{mode.label.split(" ")[0]}</span>
                {mode.co2PerKm === 0
                  ? <span className="text-xs rounded-full px-1.5 py-0.5" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A", fontSize: 9, fontWeight: 600 }}>0 CO₂</span>
                  : <span className="text-xs" style={{ color: sel ? mode.color : "#94A3B8", fontSize: 9, fontWeight: sel ? 600 : 400 }}>{mode.co2PerKm} kg/km</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Distance (km)</label>
          <div className="relative">
            <input type="number" min="0" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)}
              placeholder="e.g. 24.5" className="field-input" style={{ paddingRight: 48 }} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: "#94A3B8" }}>km</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Date</label>
          <div className="relative">
            <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="field-input" />
            <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#94A3B8" }} />
          </div>
        </div>
      </div>
    </div>
  );
}