//src/lib/menu-data.ts
import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { DEFAULT_THEME, HEX_RE, type ThemeColors } from "@/lib/theme";

const safe = (value: string | undefined, fallback: string) =>
  value && HEX_RE.test(value) ? value : fallback;

export const getMenuData = cache(async () => {
  const [s, categories] = await Promise.all([
    db.settings.findUnique({ where: { id: 1 } }),
    db.category.findMany({
      where: { isVisible: true, dishes: { some: { isVisible: true } } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        dishes: {
          where: { isVisible: true },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          select: {
            id: true,
            name: true,
            description: true,
            priceCents: true,
            isAvailable: true,
            showSchedule: true,
            scheduleFrom: true,
            scheduleTo: true,
            tags: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
              select: { id: true, name: true, color: true, icon: true },
            },
          },
        },
      },
    }),
  ]);

  const theme: ThemeColors = {
    colorPrimary: safe(s?.colorPrimary, DEFAULT_THEME.colorPrimary),
    colorSecondary: safe(s?.colorSecondary, DEFAULT_THEME.colorSecondary),
    colorBackground: safe(s?.colorBackground, DEFAULT_THEME.colorBackground),
    colorText: safe(s?.colorText, DEFAULT_THEME.colorText),
    colorPrice: safe(s?.colorPrice, DEFAULT_THEME.colorPrice),
  };

  return {
    restaurantName: s?.restaurantName ?? "Mi Restaurante",
    slogan: s?.slogan ?? null,
    phone: s?.phone ?? null,
    address: s?.address ?? null,
    currency: s?.currencySymbol ?? "RD$",
    showSchedules: s?.showSchedules ?? true,
    theme,
    categories,
  };
});