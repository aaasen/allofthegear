import type { Bag, TripItem } from "../api/types";
import { BagButtons } from "./BagButtons";

interface Props {
  item: TripItem;
  bags: Bag[];
  onSelectBag: (item: TripItem, bagId: number | null) => void;
  onTogglePacked: (item: TripItem) => void;
}

export function PackingRow({ item, bags, onSelectBag, onTogglePacked }: Props) {
  const packed = item.packed === 1;

  const weightDisplay =
    item.weight_g != null
      ? item.quantity > 1
        ? `${item.weight_g * item.quantity}g (${item.quantity}×${item.weight_g}g)`
        : `${item.weight_g}g`
      : null;

  return (
    <div
      onClick={() => onTogglePacked(item)}
      className={`flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 last:border-b-0 cursor-pointer select-none ${
        packed ? "bg-gray-100 hover:bg-gray-200" : "bg-white hover:bg-gray-50"
      }`}
    >
      {/* Packed indicator */}
      <div className="text-base leading-none w-7 shrink-0 text-center">
        {packed ? "✅" : "❌"}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${packed ? "line-through text-gray-400" : "text-gray-900"}`}
        >
          {item.name}
        </span>
        {item.quantity > 1 && (
          <span className="ml-1.5 text-xs text-gray-400">×{item.quantity}</span>
        )}
        {item.type && (
          <span className="hidden sm:inline ml-2 text-xs text-gray-400">{item.type}</span>
        )}
        {weightDisplay && (
          <span className="hidden sm:inline ml-2 text-xs text-gray-500 tabular-nums">
            {weightDisplay}
          </span>
        )}
      </div>

      {/* Bag buttons — always right-anchored */}
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <BagButtons
          bags={bags}
          activeBagId={item.bag_id}
          onSelect={(bagId) => onSelectBag(item, bagId)}
        />
      </div>
    </div>
  );
}
