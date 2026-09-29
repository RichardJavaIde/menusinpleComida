  //src/app/admin/platos/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parsePriceToCents } from "@/lib/price";
import type { ActionResult } from "@/lib/action-result";

export type DishFormState = { error?: string; success?: boolean; message?: string };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(80, "Máximo 80 caracteres."),
  description: z.string().trim().max(300, "La descripción admite máximo 300 caracteres."),
  price: z.string(),
  categoryId: z.coerce.number().int().positive("Elige una categoría."),
  isVisible: z.boolean(),
  isAvailable: z.boolean(),
  showSchedule: z.boolean(),
  scheduleFrom: z.string(),
  scheduleTo: z.string(),
  tagIds: z.array(z.coerce.number().int().positive()),
});

function refresh() {
  revalidatePath("/admin/platos");
  revalidatePath("/admin/categorias");
  revalidatePath("/admin");
  revalidatePath("/menu");
}

async function nextOrder(categoryId: number) {
  const last = await db.dish.aggregate({ where: { categoryId }, _max: { sortOrder: true } });
  return (last._max.sortOrder ?? 0) + 1;
}

export async function saveDish(
  _prev: DishFormState,
  formData: FormData,
): Promise<DishFormState> {
  await requireUser();

  const parsed = schema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    price: formData.get("price") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    isVisible: formData.get("isVisible") === "on",
    isAvailable: formData.get("isAvailable") === "on",
    showSchedule: formData.get("showSchedule") === "on",
    scheduleFrom: formData.get("scheduleFrom") ?? "",
    scheduleTo: formData.get("scheduleTo") ?? "",
    tagIds: formData.getAll("tagIds").map(String),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const v = parsed.data;

  const priceCents = parsePriceToCents(v.price);
  if (priceCents === null) {
    return { error: "Precio no válido. Usa números, por ejemplo 350 o 350.50." };
  }

  const scheduleFrom = TIME.test(v.scheduleFrom) ? v.scheduleFrom : null;
  const scheduleTo = TIME.test(v.scheduleTo) ? v.scheduleTo : null;
  if (v.showSchedule && (!scheduleFrom || !scheduleTo)) {
    return { error: "Indica la hora de inicio y la de fin para mostrar el horario." };
  }

  const category = await db.category.findUnique({
    where: { id: v.categoryId },
    select: { id: true },
  });
  if (!category) return { error: "La categoría elegida ya no existe." };

  // Solo etiquetas que existan y estén activas
  const validTags = await db.tag.findMany({
    where: { id: { in: v.tagIds }, isActive: true },
    select: { id: true },
  });

  const data = {
    name: v.name,
    description: v.description || null,
    priceCents,
    categoryId: v.categoryId,
    isVisible: v.isVisible,
    isAvailable: v.isAvailable,
    showSchedule: v.showSchedule,
    scheduleFrom,
    scheduleTo,
  };

  const rawId = formData.get("id");
  const id = rawId ? Number(rawId) : null;

  if (id) {
    const existing = await db.dish.findUnique({
      where: { id },
      select: {
        categoryId: true,
        // etiquetas desactivadas que el plato ya tenía: no se pierden al editar
        tags: { where: { isActive: false }, select: { id: true } },
      },
    });
    if (!existing) return { error: "El plato ya no existe." };

    const keepIds = [...validTags.map((t) => t.id), ...existing.tags.map((t) => t.id)];
    const movedCategory = existing.categoryId !== v.categoryId;

    await db.dish.update({
      where: { id },
      data: {
        ...data,
        ...(movedCategory ? { sortOrder: await nextOrder(v.categoryId) } : {}),
        tags: { set: keepIds.map((tagId) => ({ id: tagId })) },
      },
    });
    refresh();
    return { success: true, message: `Plato "${v.name}" actualizado.` };
  }

  await db.dish.create({
    data: {
      ...data,
      sortOrder: await nextOrder(v.categoryId),
      tags: { connect: validTags.map((t) => ({ id: t.id })) },
    },
  });
  refresh();
  return { success: true, message: `Plato "${v.name}" creado.` };
}

export async function toggleDishVisibility(id: number): Promise<ActionResult> {
  await requireUser();

  const dish = await db.dish.findUnique({
    where: { id },
    select: { name: true, isVisible: true },
  });
  if (!dish) return { ok: false, error: "El plato ya no existe." };

  const next = !dish.isVisible;
  await db.dish.update({ where: { id }, data: { isVisible: next } });
  refresh();
  return {
    ok: true,
    message: `"${dish.name}" ahora está ${next ? "visible" : "oculto"} en el menú.`,
  };
}

export async function toggleDishAvailability(id: number): Promise<ActionResult> {
  await requireUser();

  const dish = await db.dish.findUnique({
    where: { id },
    select: { name: true, isAvailable: true },
  });
  if (!dish) return { ok: false, error: "El plato ya no existe." };

  const next = !dish.isAvailable;
  await db.dish.update({ where: { id }, data: { isAvailable: next } });
  refresh();
  return {
    ok: true,
    message: next
      ? `"${dish.name}" vuelve a estar disponible.`
      : `"${dish.name}" marcado como agotado.`,
  };
}

export async function moveDish(id: number, direction: "up" | "down"): Promise<ActionResult> {
  await requireUser();

  const dish = await db.dish.findUnique({ where: { id }, select: { categoryId: true } });
  if (!dish) return { ok: false, error: "El plato ya no existe." };

   const list = await db.dish.findMany({
    where: { categoryId: dish.categoryId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, sortOrder: true },
  });
  const i = list.findIndex((d) => d.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true, message: "Orden actualizado." };

  [list[i], list[j]] = [list[j], list[i]];

  // Solo se actualizan los platos cuyo número de orden realmente cambia
  const changes = list.filter((d, idx) => d.sortOrder !== idx + 1);
  await db.$transaction(
    changes.map((d) =>
      db.dish.update({
        where: { id: d.id },
        data: { sortOrder: list.indexOf(d) + 1 },
      }),
    ),
  );
  refresh();
  return { ok: true, message: "Orden actualizado." };
}

export async function deleteDish(id: number): Promise<ActionResult> {
  await requireUser();

  const dish = await db.dish.findUnique({ where: { id }, select: { name: true } });
  if (!dish) return { ok: false, error: "El plato ya no existe." };

  await db.dish.delete({ where: { id } });
  refresh();
  return { ok: true, tone: "danger", message: `Plato "${dish.name}" eliminado.` };
}