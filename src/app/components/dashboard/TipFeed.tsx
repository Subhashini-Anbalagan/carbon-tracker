import {
  Car, CarFront, Bus, TrainFront, Plane, Bike,
  Utensils, Beef, Salad, Coffee, Apple,
  Zap, Wind, Battery, Circle, Droplets, Flame, Home,
} from "lucide-react";

// Maps an action's category to the same icon/color scheme used elsewhere
// in the app (Activity Logger tabs, category breakdown chart, etc.)
const CATEGORY_META: Record<string, { icon: any; color: string; label: string }> = {
  travel: { icon: Car, color: "#3B82F6", label: "Travel tip" },
  food: { icon: Utensils, color: "#F59E0B", label: "Food tip" },
  electricity: { icon: Zap, color: "#8B5CF6", label: "Electricity tip" },
};

// subType -> specific icon, matched 1:1 to the id sets used in
// TravelForm / FoodForm / ElectricityForm so the tip feed always shows
// exactly the icon the user picked when logging the action.
const SUBTYPE_ICONS: Record<string, Record<string, any>> = {
  travel: { car: Car, scooty: CarFront, bus: Bus, train: TrainFront, plane: Plane, bike: Bike },
  food: { beef: Beef, chicken: Utensils, fish: Utensils, vegetarian: Salad, vegan: Apple, coffee: Coffee },
  electricity: { fan: Wind, bulb: Zap, fridge: Battery, tv: Circle, ac: Wind, washing: Droplets, geyser: Flame, mixer: Home },
};

const getImpactTag = (carbonKg: number) => {
  if (carbonKg > 4) return { tag: "High Impact", tagColor: "#EF4444" };
  if (carbonKg > 2) return { tag: "Moderate", tagColor: "#F59E0B" };
  return { tag: "Low Impact", tagColor: "#16A34A" };
};

const formatTime = (loggedAt: any) => {
  if (!loggedAt?.toDate) return "Just now";
  const diffMs = Date.now() - loggedAt.toDate().getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

interface TipFeedProps {
  tips: Array<{
    id: string;
    category: string;
    subType?: string;
    carbonKg: number;
    geminiTip: string;
    loggedAt: any;
  }>;
  loading: boolean;
}

export const TipFeed = ({ tips, loading }: TipFeedProps) => {
  if (loading) {
    return (
      <div className="text-xs text-center py-6" style={{ color: "#94A3B8" }}>
        Loading tips…
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div className="text-xs text-center py-6" style={{ color: "#94A3B8" }}>
        Log an activity to get your first AI tip.
      </div>
    );
  }

  return (
    <>
      {tips.map((t, i) => {
        const meta = CATEGORY_META[t.category] || CATEGORY_META.travel;
        const Icon = SUBTYPE_ICONS[t.category]?.[t.subType || ""] || meta.icon;
        const { tag, tagColor } = getImpactTag(t.carbonKg);
        return (
          <div
            key={t.id}
            className="rounded-2xl p-4 cursor-pointer group transition-all duration-150"
            style={{
              background: "#F8FAFC",
              border: "1px solid rgba(15,23,42,0.07)",
              animation: `fadeUp 0.5s ease forwards`,
              animationDelay: `${0.1 + i * 0.1}s`,
              opacity: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "#F1F5F9";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(15,23,42,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "#F8FAFC";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(15,23,42,0.07)";
            }}
          >
            <div className="flex items-start gap-2.5 mb-2.5">
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0 mt-0.5"
                style={{ width: 30, height: 30, background: `${meta.color}12` }}
              >
                <Icon size={14} style={{ color: meta.color }} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${tagColor}10`, color: tagColor, whiteSpace: "nowrap" }}
                  >
                    {tag}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: "#94A3B8" }}>
                    {formatTime(t.loggedAt)}
                  </span>
                </div>
                <p className="text-xs font-semibold mt-1" style={{ color: "#0F172A", lineHeight: 1.4 }}>
                  {meta.label}
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>
              {t.geminiTip}
            </p>
          </div>
        );
      })}
    </>
  );
};