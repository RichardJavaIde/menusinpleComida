//src/components/tag-chip.tsx
import { CategoryIcon } from "@/components/category-icon";

export function TagChip({
  name,
  color,
  icon,
}: {
  name: string;
  color?: string | null;
  icon?: string | null;
}) {
  const custom = color && /^#[0-9A-Fa-f]{6}$/.test(color);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        custom ? "" : "bg-amber-50 text-amber-800"
      }`}
      style={custom ? { backgroundColor: `${color}1A`, color: color! } : undefined}
    >
      {icon && <CategoryIcon name={icon} className="size-3" />}
      {name}
    </span>
  );
}