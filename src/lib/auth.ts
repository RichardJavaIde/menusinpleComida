//src/lib/auth.ts
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSession } from "@/lib/session";

export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.uid },
    select: {
      id: true, name: true, email: true, role: true, isActive: true, sessionVersion: true,
    },
  });

  if (!user || !user.isActive || user.sessionVersion !== session.ver) return null;

  const { sessionVersion: _v, ...safe } = user;
  return safe;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/admin?denied=1");
  return user;
}