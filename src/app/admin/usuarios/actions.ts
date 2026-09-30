//src/app/admin/usuarios/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import type { ActionResult } from "@/lib/action-result";

export type UserFormState = { error?: string; success?: boolean; message?: string };

const DENIED = "No tienes permiso para gestionar usuarios.";
const LAST_ADMIN = "Debe existir al menos un administrador activo.";
const UNEXPECTED = "Ocurrió un error inesperado. Inténtalo de nuevo.";

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña admite máximo 72 caracteres.")
  .regex(/[A-Za-z]/, "La contraseña debe incluir al menos una letra.")
  .regex(/\d/, "La contraseña debe incluir al menos un número.");

const baseSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(60, "El nombre admite máximo 60 caracteres."),
  email: z.string().trim().toLowerCase().email("El correo no es válido.").max(120, "El correo admite máximo 120 caracteres."),
  role: z.string(),
  isActive: z.boolean(),
});

/** Devuelve el usuario solo si es ADMIN activo (leído de la base de datos) */
async function getAdmin() {
  const user = await getCurrentUser();
  return user && user.role === "ADMIN" ? user : null;
}

async function hasOtherActiveAdmin(tx: Prisma.TransactionClient, excludeId: number) {
  const n = await tx.user.count({
    where: { role: "ADMIN", isActive: true, id: { not: excludeId } },
  });
  return n > 0;
}

function refresh() {
  revalidatePath("/admin/usuarios");
}

export async function saveUser(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await getAdmin();
  if (!actor) return { error: DENIED };

  const parsed = baseSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    role: formData.get("role") ?? "",
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." };

  const v = parsed.data;
  if (!(ROLES as readonly string[]).includes(v.role)) return { error: "Elige un rol válido." };

  const rawId = formData.get("id");
  const id = rawId ? Number(rawId) : null;

  try {
    // ── Crear ─────────────────────────────────────────────
    if (!id) {
      const pwd = passwordSchema.safeParse(formData.get("password") ?? "");
      if (!pwd.success) return { error: pwd.error.issues[0]?.message ?? "Contraseña no válida." };

      if (await db.user.findUnique({ where: { email: v.email }, select: { id: true } })) {
        return { error: "Ya existe un usuario con ese correo." };
      }

      await db.user.create({
        data: {
          name: v.name,
          email: v.email,
          role: v.role,
          isActive: v.isActive,
          passwordHash: await bcrypt.hash(pwd.data, 12),
        },
      });
      refresh();
      return { success: true, message: `Usuario "${v.name}" creado.` };
    }

    // ── Editar ────────────────────────────────────────────
    const result = await db.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id } });
      if (!target) return { error: "El usuario ya no existe." };

      // Sobre uno mismo no se puede cambiar el rol ni el estado
      const isSelf = target.id === actor.id;
      const role = isSelf ? target.role : v.role;
      const isActive = isSelf ? target.isActive : v.isActive;

      const losesAdmin =
        target.role === "ADMIN" && target.isActive && (role !== "ADMIN" || !isActive);
      if (losesAdmin && !(await hasOtherActiveAdmin(tx, target.id))) {
        return { error: LAST_ADMIN };
      }

      const dup = await tx.user.findUnique({ where: { email: v.email }, select: { id: true } });
      if (dup && dup.id !== id) return { error: "Ya existe un usuario con ese correo." };

      await tx.user.update({
        where: { id },
        data: { name: v.name, email: v.email, role, isActive },
      });
      return { ok: true as const };
    });

    if ("error" in result) return { error: result.error };
    refresh();
    return { success: true, message: `Usuario "${v.name}" actualizado.` };
  } catch {
    return { error: UNEXPECTED };
  }
}

export async function resetUserPassword(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const actor = await getAdmin();
  if (!actor) return { error: DENIED };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Usuario no válido." };

  const pwd = passwordSchema.safeParse(formData.get("password") ?? "");
  if (!pwd.success) return { error: pwd.error.issues[0]?.message ?? "Contraseña no válida." };

  try {
    const target = await db.user.findUnique({ where: { id }, select: { name: true } });
    if (!target) return { error: "El usuario ya no existe." };

    await db.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(pwd.data, 12),
  sessionVersion: { increment: 1 }, },
    });
    refresh();
    return { success: true, message: `Contraseña de "${target.name}" restablecida.` };
  } catch {
    return { error: UNEXPECTED };
  }
}

export async function toggleUserActive(id: number): Promise<ActionResult> {
  const actor = await getAdmin();
  if (!actor) return { ok: false, error: DENIED };
  if (id === actor.id) return { ok: false, error: "No puedes desactivar tu propia cuenta." };

  const result = await db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id } });
    if (!target) return { error: "El usuario ya no existe." };

    const next = !target.isActive;
    if (!next && target.role === "ADMIN" && !(await hasOtherActiveAdmin(tx, target.id))) {
      return { error: LAST_ADMIN };
    }

    await tx.user.update({ where: { id }, data: { isActive: next } });
    return { name: target.name, next };
  });

  if (result.error) return { ok: false, error: result.error };
  refresh();
  return {
    ok: true,
    message: result.next
      ? `Usuario "${result.name}" activado.`
      : `Usuario "${result.name}" desactivado. Ya no puede iniciar sesión.`,
  };
}

export async function deleteUser(id: number): Promise<ActionResult> {
  const actor = await getAdmin();
  if (!actor) return { ok: false, error: DENIED };
  if (id === actor.id) return { ok: false, error: "No puedes eliminar tu propia cuenta." };

  const result = await db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id } });
    if (!target) return { error: "El usuario ya no existe." };

    if (target.role === "ADMIN" && target.isActive && !(await hasOtherActiveAdmin(tx, target.id))) {
      return { error: LAST_ADMIN };
    }

    await tx.user.delete({ where: { id } });
    return { name: target.name };
  });

  if (result.error) return { ok: false, error: result.error };
  refresh();
  return { ok: true, tone: "danger", message: `Usuario "${result.name}" eliminado.` };
}