//src/lib/auth.ts
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSession } from "@/lib/session";

export const getCurrentUser = cache(async () => {
  const uid = await readSession();
  if (!uid) return null;

  const user = await db.user.findUnique({
    where: { id: uid },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;
  return user;
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