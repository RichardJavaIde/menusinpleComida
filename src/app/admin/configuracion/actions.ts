//src/app/admin/configuracion/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { HEX_RE } from "@/lib/theme";

export type SettingsFormState = { error?: string; success?: boolean; message?: string };

const color = (label: string) => z.string().regex(HEX_RE, `${label} no es válido. Usa el formato #RRGGBB.`);

const schema = z.object({
  restaurantName: z.string().trim().min(1, "El nombre del negocio es obligatorio.").max(60, "El nombre admite máximo 60 caracteres."),
  slogan: z.string().trim().max(120, "El eslogan admite máximo 120 caracteres."),
  phone: z.string().trim().max(30, "El teléfono admite máximo 30 caracteres."),
  address: z.string().trim().max(200, "La dirección admite máximo 200 caracteres."),
  currencySymbol: z.string().trim().min(1, "El símbolo de moneda es obligatorio.").max(8, "El símbolo admite máximo 8 caracteres."),
  showSchedules: z.boolean(),
  colorPrimary: color("El color principal"),
  colorSecondary: color("El color secundario"),
  colorBackground: color("El color de fondo"),
  colorText: color("El color del texto"),
  colorPrice: color("El color de los precios"),
});

export async function saveSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  // Se valida el rol en el servidor, con datos frescos de la base de datos
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "No tienes permiso para cambiar la configuración." };
  }

  const parsed = schema.safeParse({
    restaurantName: formData.get("restaurantName") ?? "",
    slogan: formData.get("slogan") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    currencySymbol: formData.get("currencySymbol") ?? "",
    showSchedules: formData.get("showSchedules") === "on",
    colorPrimary: formData.get("colorPrimary") ?? "",
    colorSecondary: formData.get("colorSecondary") ?? "",
    colorBackground: formData.get("colorBackground") ?? "",
    colorText: formData.get("colorText") ?? "",
    colorPrice: formData.get("colorPrice") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const v = parsed.data;

  const data = {
    restaurantName: v.restaurantName,
    slogan: v.slogan || null,
    phone: v.phone || null,
    address: v.address || null,
    currencySymbol: v.currencySymbol,
    showSchedules: v.showSchedules,
    colorPrimary: v.colorPrimary.toUpperCase(),
    colorSecondary: v.colorSecondary.toUpperCase(),
    colorBackground: v.colorBackground.toUpperCase(),
    colorText: v.colorText.toUpperCase(),
    colorPrice: v.colorPrice.toUpperCase(),
  };

  await db.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/platos"); // la moneda se muestra en la lista de platos
  revalidatePath("/menu");

  return { success: true, message: "Configuración guardada." };
}