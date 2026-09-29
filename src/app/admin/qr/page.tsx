//src/app/admin/qr/page.tsx
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { QrGenerator } from "./qr-generator";

export const metadata = { title: "Código QR" };

export default async function QrPage() {
  await requireUser();

  const s = await db.settings.findUnique({
    where: { id: 1 },
    select: { restaurantName: true },
  });

  return (
    <>
      <PageHeader
        title="Código QR"
        description="Genera el QR que lleva a tu menú público. Imprímelo y ponlo en las mesas."
      />
      <QrGenerator
        defaultSite={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
        restaurantName={s?.restaurantName ?? "Mi Restaurante"}
      />
    </>
  );
}