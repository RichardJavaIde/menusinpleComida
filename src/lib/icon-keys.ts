//src/lib/icon-keys.ts
export const ICON_KEYS = [
  "utensils", "salad", "soup", "pizza", "sandwich", "beef", "fish", "drumstick",
  "egg", "croissant", "cookie", "cake", "coffee", "cup-soda", "wine", "beer",
  "cherry", "apple", "carrot", "leaf", "flame", "star", "sparkles",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];