//src/app/admin/platos/page.tsx
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { DishManager } from "./dish-manager";

export const metadata = { title: "Platos" };

export default async function DishesPage() {
  await requireUser();

  const [settings, categories, tags, dishes] = await Promise.all([
    db.settings.findUnique({ where: { id: 1 }, select: { currencySymbol: true } }),
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, name: true, isVisible: true },
    }),
    db.tag.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
    db.dish.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        categoryId: true,
        isVisible: true,
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
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Platos"
        description="Administra los platos, sus precios y su disponibilidad."
      />
      <DishManager
        dishes={dishes}
        categories={categories}
        tags={tags}
        currency={settings?.currencySymbol ?? "RD$"}
      />
    </>
  );
}