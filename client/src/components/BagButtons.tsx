import type { Bag } from "../api/types";

interface Props {
  bags: Bag[];
  activeBagId: number | null;
  onSelect: (bagId: number | null) => void;
}

const BAG_COLORS: Record<string, string> = {
  Ski: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200",
  Duffel: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200",
  "Carry-on": "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
};

const ACTIVE_COLORS: Record<string, string> = {
  Ski: "bg-blue-600 text-white border-blue-600",
  Duffel: "bg-purple-600 text-white border-purple-600",
  "Carry-on": "bg-green-600 text-white border-green-600",
};

const DEFAULT_COLOR = "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200";
const DEFAULT_ACTIVE = "bg-gray-600 text-white border-gray-600";

export function BagButtons({ bags, activeBagId, onSelect }: Props) {
  return (
    <div className="flex gap-1 justify-end">
      {bags.map((bag) => {
        const isActive = bag.id === activeBagId;
        const activeClass = ACTIVE_COLORS[bag.name] ?? DEFAULT_ACTIVE;
        const inactiveClass = BAG_COLORS[bag.name] ?? DEFAULT_COLOR;
        return (
          <button
            key={bag.id}
            onClick={() => onSelect(isActive ? null : bag.id)}
            className={`px-2 py-0.5 rounded border text-xs font-medium transition-colors ${
              isActive ? activeClass : inactiveClass
            }`}
          >
            {bag.name}
          </button>
        );
      })}
    </div>
  );
}
