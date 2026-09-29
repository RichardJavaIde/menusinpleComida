//src/app/admin/usuarios/page.tsx
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { UserManager } from "./user-manager";

export const metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const me = await requireAdmin();

  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Quién puede entrar al panel. Los administradores lo controlan todo; los usuarios no acceden a Configuración ni a Usuarios."
      />
      <UserManager
        currentUserId={me.id}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt.toLocaleDateString("es-DO", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        }))}
      />
    </>
  );
}