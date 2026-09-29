//src/components/category-icon.tsx
import {
  Utensils, Salad, Soup, Pizza, Sandwich, Beef, Fish, Drumstick, Egg, Croissant,
  Cookie, Cake, Coffee, CupSoda, Wine, Beer, Cherry, Apple, Carrot, Leaf, Flame,
  Star, Sparkles, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  utensils: Utensils, salad: Salad, soup: Soup, pizza: Pizza, sandwich: Sandwich,
  beef: Beef, fish: Fish, drumstick: Drumstick, egg: Egg, croissant: Croissant,
  cookie: Cookie, cake: Cake, coffee: Coffee, "cup-soda": CupSoda, wine: Wine,
  beer: Beer, cherry: Cherry, apple: Apple, carrot: Carrot, leaf: Leaf,
  flame: Flame, star: Star, sparkles: Sparkles,
};

export function CategoryIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && MAP[name]) || Utensils;
  return <Icon className={className} aria-hidden="true" />;
}