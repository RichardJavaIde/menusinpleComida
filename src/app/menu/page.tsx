//src/app/menu/page.tsx
import type { Metadata, Viewport } from "next";
import { MapPin, Phone } from "lucide-react";
import { getMenuData } from "@/lib/menu-data";
import { readableOn } from "@/lib/theme";
import { MenuView } from "./menu-view";

export const revalidate = 3600;
export async function generateMetadata(): Promise<Metadata> {
  const m = await getMenuData();
  return {
     title: `${m.restaurantName} · Menú`,
  description: m.slogan ?? `Menú digital de ${m.restaurantName}`,
  alternates: { canonical: "/menu" },
  openGraph: {
    title: `${m.restaurantName} · Menú`,
    description: m.slogan ?? `Menú digital de ${m.restaurantName}`,
    type: "website",
  },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const m = await getMenuData();
  return { width: "device-width", initialScale: 1, themeColor: m.theme.colorSecondary };
}

export default async function MenuPage() {
  const m = await getMenuData();
  const t = m.theme;

  const css = `:root{
    --brand-primary:${t.colorPrimary};
    --brand-secondary:${t.colorSecondary};
    --brand-bg:${t.colorBackground};
    --brand-text:${t.colorText};
    --brand-price:${t.colorPrice};
    --brand-on-primary:${readableOn(t.colorPrimary)};
    --brand-on-secondary:${readableOn(t.colorSecondary)};
  }`;

  return (
    <div className="min-h-dvh bg-bg text-text">
      <style>{css}</style>

      <header className="bg-secondary px-4 pb-8 pt-[max(2.5rem,env(safe-area-inset-top))] text-center text-on-secondary">
        <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          {m.restaurantName}
        </h1>
        {m.slogan && <p className="mx-auto mt-2 max-w-md text-sm opacity-80">{m.slogan}</p>}
        <div className="mx-auto mt-5 h-0.5 w-12 rounded-full bg-primary" />
      </header>

      <MenuView
        categories={m.categories}
        currency={m.currency}
        showSchedules={m.showSchedules}
        tagFallbackColor={t.colorPrimary}
      />

      {(m.phone || m.address) && (
        <footer className="border-t border-text/10 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-sm">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-text/70">
            {m.address && (
              <p className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {m.address}
              </p>
            )}
            {m.phone && (
              <a
                href={`tel:${m.phone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
              >
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                {m.phone}
              </a>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}