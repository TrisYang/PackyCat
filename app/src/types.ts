export interface ChecklistItem {
  id: string;
  text: string;
  packed: boolean;
}

export interface Category {
  id: string;
  name: string;
  items: ChecklistItem[];
  isBonus?: boolean;
  icon: string;
}

export interface TripConfig {
  destination: string;
  days: number | '';
  purpose: string;
}

export interface TripHistory {
  id: string;
  config: TripConfig;
  categories: Category[];
  createdAt: string;
}

export interface PackedSlot {
  x: number;   // % within inner area (0-100)
  y: number;   // % within inner area (0-100)
  rotate: number;
  order: number; // stacking order: higher = on top
  scale: number;
  addedAt: number; // timestamp for pop-in animation
  image?: string; // override image for batch-packed categories
}

export type CatAction = 'idle' | 'reaching' | 'holding' | 'placing' | 'removing' | 'jumping' | 'pulling';
