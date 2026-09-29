//src/app/admin/page.tsx
import Link from "next/link";
import {
  Ban, ExternalLink, EyeOff, Eye, FolderTree, UtensilsCrossed, type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { formatPrice } from "@/lib/theme";
import { timeAgo } from "@/lib/time";

export const metadata = { title: "Dashboard" };

function StatCard({
  label, value, icon: Icon, href, hint, tone = "amber",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  hint?: string;
  tone?: "amber" | "green" | "stone";
}) {
  const tones = {
    amber: "bg-amber-100 text-amber-800",
    green: "bg-green-100 text-green-800",
    stone: "bg-stone-100 text-stone-600",
  };

  return (
    <Link
      href={href}
      className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 transition hover:ring-stone-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </Link>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requireUser();
  const { denied } = await searchParams;

  const [settings, categories, dishes, visible, unavailable, live, recent] = await Promise.all([
    db.settings.findUnique({ where: { id: 1 }, select: { currencySymbol: true } }),
    db.category.count(),
    db.dish.count(),
    db.dish.count({ where: { isVisible: true } }),
    db.dish.count({ where: { isAvailable: false } }),
    // Platos que el cliente realmente ve: visibles y en una categoría visible
    db.dish.count({ where: { isVisible: true, category: { isVisible: true } } }),
    db.dish.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 5,
      select: {
        id: true,
        name: true,
        priceCents: true,
        isVisible: true,
        isAvailable: true,
        updatedAt: true,
        category: { select: { name: true, isVisible: true } },
      },
    }),
  ]);

  const hidden = dishes - visible;
  const currency = settings?.currencySymbol ?? "RD$";
  const now = new Date();

  return (
    <>
      <PageHeader title={`Hola, ${user.name}`} description="Resumen de tu menú digital." />

      {denied && (
        <p role="alert" className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No tienes permiso para acceder a esa sección.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Categorías"
          value={categories}
          icon={FolderTree}
          href="/admin/categorias"
        />
        <StatCard
          label="Platos"
          value={dishes}
          icon={UtensilsCrossed}
          href="/admin/platos"
        />
        <StatCard
          label="Platos visibles"
          value={visible}
          icon={Eye}
          href="/admin/platos"
          tone="green"
          hint={
            live !== visible
              ? `${live} se muestran al cliente (el resto está en categorías ocultas)`
              : undefined
          }
        />
        <StatCard
          label="Platos ocultos"
          value={hidden}
          icon={EyeOff}
          href="/admin/platos"
          tone="stone"
        />
      </div>

      {unavailable > 0 && (
        <Link
          href="/admin/platos"
          className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-100 hover:bg-red-100/60"
        >
          <Ban className="size-4 shrink-0" aria-hidden="true" />
          {unavailable === 1
            ? "1 plato está marcado como agotado."
            : `${unavailable} platos están marcados como agotados.`}
        </Link>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Últimos platos modificados</h2>
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-amber-800 hover:underline"
          >
            Ver menú público
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="font-medium">Aún no hay platos</p>
            <p className="mt-1 text-sm text-stone-500">
              Cuando crees o edites platos, aparecerán aquí.
            </p>
            <Link
              href="/admin/platos"
              className="mt-4 inline-block rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-800"
            >
              Ir a platos
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-2xl bg-white ring-1 ring-stone-200">
            {recent.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="truncate font-medium">{d.name}</p>
                    {!d.isVisible && (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                        Oculto
                      </span>
                    )}
                    {!d.isAvailable && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
                        Agotado
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-stone-500">
                    {d.category.name}
                    {!d.category.isVisible ? " (categoría oculta)" : ""} ·{" "}
                    <time dateTime={d.updatedAt.toISOString()}>
                      {timeAgo(d.updatedAt, now)}
                    </time>
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-green-700">
                  {formatPrice(d.priceCents, currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}