//src/app/admin/configuracion/page.tsx
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  await requireAdmin();

  const s = await db.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Datos del negocio y apariencia del menú público."
      />
      <SettingsForm
        initial={{
          restaurantName: s.restaurantName,
          slogan: s.slogan ?? "",
          phone: s.phone ?? "",
          address: s.address ?? "",
          currencySymbol: s.currencySymbol,
          showSchedules: s.showSchedules,
          colorPrimary: s.colorPrimary,
          colorSecondary: s.colorSecondary,
          colorBackground: s.colorBackground,
          colorText: s.colorText,
          colorPrice: s.colorPrice,
        }}
      />
    </>
  );
}