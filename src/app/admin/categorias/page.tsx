//src/app/admin/categorias/page.tsx
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryManager } from "./category-manager";

export const metadata = { title: "Categorías" };

export default async function CategoriesPage() {
  await requireUser();

  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      isVisible: true,
      _count: { select: { dishes: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Categorías"
        description="Organiza tu menú en secciones. El orden de aquí es el orden que verá el cliente."
      />
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          icon: c.icon,
          isVisible: c.isVisible,
          dishCount: c._count.dishes,
        }))}
      />
    </>
  );
}