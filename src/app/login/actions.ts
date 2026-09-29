//src/app/login/actions.ts
"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { isLimited, registerFailure, clearFailures } from "@/lib/rate-limit";

export type LoginState = { error?: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// Hash falso: se compara igual aunque el usuario no exista,
// para que el tiempo de respuesta no revele qué correos existen.
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 12);

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Correo o contraseña incorrectos." };

  const { email, password } = parsed.data;

  if (isLimited(email)) {
    return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  }

  const user = await db.user.findUnique({ where: { email } });
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordOk || !user.isActive) {
    registerFailure(email);
    return { error: "Correo o contraseña incorrectos." };
  }

  clearFailures(email);
  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}