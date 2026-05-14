export interface Bag {
  id: number;
  name: string;
}

export interface Trip {
  id: number;
  name: string;
  created_at: string;
}

export interface TripItem {
  id: number;
  trip_id: number;
  name: string;
  weight_g: number | null;
  type: string | null;
  group_name: string | null;
  is_group_gear: number;
  quantity: number;
  bag_id: number | null;
  bag_name: string | null;
  packed: number;
}

export interface WeightByBag {
  bag: string;
  bag_id: number | null;
  weight_g: number | null;
  item_count: number;
}

export interface WeightByGroup {
  group_name: string;
  is_group_gear: number;
  weight_g: number | null;
  item_count: number;
}

export interface ImportItem {
  name: string;
  weight_g: number | null;
  type: string | null;
  group_name: string | null;
  is_group_gear: number;
  quantity: number;
  bag_name?: string | null;
  packed?: number;
}

export interface WeightSummary {
  total_weight_g: number;
  unknown_count: number;
  by_bag: WeightByBag[];
  by_group: WeightByGroup[];
  by_personal_group: { is_group_gear: number; weight_g: number | null; item_count: number }[];
}
