//src/app/admin/etiquetas/page.tsx
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { TagManager } from "./tag-manager";

export const metadata = { title: "Etiquetas" };

export default async function TagsPage() {
  await requireUser();

  const tags = await db.tag.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      isActive: true,
      _count: { select: { dishes: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Etiquetas"
        description="Son opcionales. Solo las activas se pueden asignar a platos y se muestran al cliente."
      />
      <TagManager
        tags={tags.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
          icon: t.icon,
          isActive: t.isActive,
          dishCount: t._count.dishes,
        }))}
      />
    </>
  );
}