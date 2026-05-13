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
      : "—";

  return (
    <tr
      onClick={() => onTogglePacked(item)}
      className={`border-b border-gray-100 cursor-pointer select-none ${
        packed ? "bg-gray-100 hover:bg-gray-200" : "bg-white hover:bg-gray-50"
      }`}
    >
      <td className="py-2 pl-3 pr-1 text-center text-base leading-none">
        {packed ? "✅" : "❌"}
      </td>
      <td className={`py-2 pr-4 text-sm truncate ${packed ? "line-through text-gray-400" : "text-gray-900"}`}>
        {item.name}
        {item.quantity > 1 && (
          <span className="ml-1.5 text-xs text-gray-400">×{item.quantity}</span>
        )}
      </td>
      <td className="py-2 pr-4 text-sm text-gray-500 tabular-nums whitespace-nowrap">
        {weightDisplay}
      </td>
      <td className="py-2 pr-3" onClick={(e) => e.stopPropagation()}>
        <BagButtons
          bags={bags}
          activeBagId={item.bag_id}
          onSelect={(bagId) => onSelectBag(item, bagId)}
        />
      </td>
    </tr>
  );
}
