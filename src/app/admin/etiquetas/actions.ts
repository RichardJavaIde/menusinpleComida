//src/app/admin/etiquetas/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ICON_KEYS } from "@/lib/icon-keys";
import type { ActionResult } from "@/lib/action-result";

export type TagFormState = { error?: string; success?: boolean; message?: string };

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(30, "Máximo 30 caracteres."),
  color: z.string().regex(/^(#[0-9A-Fa-f]{6})?$/, "Color no válido."),
  icon: z.string(),
  isActive: z.boolean(),
});

function refresh() {
  revalidatePath("/admin/etiquetas");
  revalidatePath("/admin/platos");
  revalidatePath("/menu");
}

export async function saveTag(_prev: TagFormState, formData: FormData): Promise<TagFormState> {
  await requireUser();

  const parsed = schema.safeParse({
    name: formData.get("name") ?? "",
    color: formData.get("color") ?? "",
    icon: formData.get("icon") ?? "",
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const { name, color, icon, isActive } = parsed.data;

  const rawId = formData.get("id");
  const id = rawId ? Number(rawId) : null;

  // La restricción única de SQLite distingue mayúsculas: lo comprobamos a mano
  const all = await db.tag.findMany({ select: { id: true, name: true } });
  if (all.some((t) => t.id !== id && t.name.toLowerCase() === name.toLowerCase())) {
    return { error: `Ya existe una etiqueta llamada "${name}".` };
  }

  const data = {
    name,
    color: color || null,
    icon: (ICON_KEYS as readonly string[]).includes(icon) ? icon : null,
    isActive,
  };

  if (id) {
    const exists = await db.tag.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return { error: "La etiqueta ya no existe." };
    await db.tag.update({ where: { id }, data });
    refresh();
    return { success: true, message: `Etiqueta "${name}" actualizada.` };
  }

  const last = await db.tag.aggregate({ _max: { sortOrder: true } });
  await db.tag.create({ data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  refresh();
  return { success: true, message: `Etiqueta "${name}" creada.` };
}

export async function toggleTagActive(id: number): Promise<ActionResult> {
  await requireUser();

  const tag = await db.tag.findUnique({ where: { id }, select: { name: true, isActive: true } });
  if (!tag) return { ok: false, error: "La etiqueta ya no existe." };

  const next = !tag.isActive;
  await db.tag.update({ where: { id }, data: { isActive: next } });
  refresh();
  return {
    ok: true,
    message: next
      ? `Etiqueta "${tag.name}" activada.`
      : `Etiqueta "${tag.name}" desactivada. Ya no se muestra en el menú.`,
  };
}

export async function moveTag(id: number, direction: "up" | "down"): Promise<ActionResult> {
  await requireUser();

  const list = await db.tag.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const i = list.findIndex((t) => t.id === id);
  if (i < 0) return { ok: false, error: "La etiqueta ya no existe." };

  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return { ok: true, message: "Orden actualizado." };

  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(
    list.map((t, idx) => db.tag.update({ where: { id: t.id }, data: { sortOrder: idx + 1 } })),
  );
  refresh();
  return { ok: true, message: "Orden actualizado." };
}

export async function deleteTag(id: number): Promise<ActionResult> {
  await requireUser();

  const tag = await db.tag.findUnique({
    where: { id },
    select: { name: true, _count: { select: { dishes: true } } },
  });
  if (!tag) return { ok: false, error: "La etiqueta ya no existe." };

  await db.tag.delete({ where: { id } });
  refresh();

  const n = tag._count.dishes;
  return {
    ok: true,
    tone: "danger",
    message:
      n > 0
        ? `Etiqueta "${tag.name}" eliminada y quitada de ${n} ${n === 1 ? "plato" : "platos"}.`
        : `Etiqueta "${tag.name}" eliminada.`,
  };
}