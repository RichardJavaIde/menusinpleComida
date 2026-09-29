//src/app/admin/categorias/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ICON_KEYS } from "@/lib/icon-keys";
import type { ActionResult } from "@/lib/action-result";

export type CategoryFormState = { error?: string; success?: boolean; message?: string };

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(60, "Máximo 60 caracteres."),
  description: z.string().trim().max(200, "Máximo 200 caracteres."),
  icon: z.string(),
  isVisible: z.boolean(),
});

function refresh() {
  revalidatePath("/admin/categorias");
  revalidatePath("/admin");
  revalidatePath("/menu");
}

export async function saveCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireUser();

  const parsed = schema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    icon: formData.get("icon") ?? "",
    isVisible: formData.get("isVisible") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  const { name, description, icon, isVisible } = parsed.data;
  const data = {
    name,
    description: description || null,
    icon: (ICON_KEYS as readonly string[]).includes(icon) ? icon : null,
    isVisible,
  };

  const rawId = formData.get("id");
  const id = rawId ? Number(rawId) : null;

  if (id) {
    const exists = await db.category.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return { error: "La categoría ya no existe." };
    await db.category.update({ where: { id }, data });
    refresh();
    return { success: true, message: `Categoría "${name}" actualizada.` };
  }

  const last = await db.category.aggregate({ _max: { sortOrder: true } });
  await db.category.create({
    data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
  });
  refresh();
  return { success: true, message: `Categoría "${name}" creada.` };
}

export async function toggleCategoryVisibility(id: number): Promise<ActionResult> {
  await requireUser();

  const cat = await db.category.findUnique({
    where: { id },
    select: { name: true, isVisible: true },
  });
  if (!cat) return { ok: false, error: "La categoría ya no existe." };

  const next = !cat.isVisible;
  await db.category.update({ where: { id }, data: { isVisible: next } });
  refresh();
  return {
    ok: true,
    message: `"${cat.name}" ahora está ${next ? "visible" : "oculta"} en el menú.`,
  };
}

export async function moveCategory(
  id: number,
  direction: "up" | "down",
): Promise<ActionResult> {
  await requireUser();

  const list = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const i = list.findIndex((c) => c.id === id);
  if (i < 0) return { ok: false, error: "La categoría ya no existe." };

  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return { ok: true, message: "Orden actualizado." };

  [list[i], list[j]] = [list[j], list[i]];

  // Renumera todo de 1..n para que nunca haya órdenes repetidos
  await db.$transaction(
    list.map((c, idx) =>
      db.category.update({ where: { id: c.id }, data: { sortOrder: idx + 1 } }),
    ),
  );
  refresh();
  return { ok: true, message: "Orden actualizado." };
}


export async function deleteCategory(id: number): Promise<ActionResult> {
  await requireUser();

  const cat = await db.category.findUnique({
    where: { id },
    select: { name: true, _count: { select: { dishes: true } } },
  });
  if (!cat) return { ok: false, error: "La categoría ya no existe." };

  const n = cat._count.dishes;
  if (n > 0) {
    return {
      ok: false,
      error: `No se puede eliminar "${cat.name}" porque tiene ${n} ${
        n === 1 ? "plato" : "platos"
      }. Muévelos a otra categoría o elimínalos primero.`,
    };
  }

  // Borra solo si sigue sin platos (evita el caso de que alguien
  // agregue uno justo entre la comprobación y el borrado)
  const { count } = await db.category.deleteMany({
    where: { id, dishes: { none: {} } },
  });
  if (count === 0) {
    return {
      ok: false,
      error: `No se pudo eliminar "${cat.name}" porque ahora tiene platos.`,
    };
  }

  revalidatePath("/admin/platos");
  refresh();
  return { ok: true, tone: "danger", message: `Categoría "${cat.name}" eliminada.` };
}