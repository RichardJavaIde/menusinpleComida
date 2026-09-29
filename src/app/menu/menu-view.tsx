//src/app/menu/menu-view.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Search, X } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { TagChip } from "@/components/tag-chip";
import { formatPrice } from "@/lib/theme";
import { formatTime12 } from "@/lib/time";

type Tag = { id: number; name: string; color: string | null; icon: string | null };
type Dish = {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  isAvailable: boolean;
  showSchedule: boolean;
  scheduleFrom: string | null;
  scheduleTo: string | null;
  tags: Tag[];
};
type Category = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  dishes: Dish[];
};

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function MenuView({
  categories,
  currency,
  showSchedules,
  tagFallbackColor,
}: {
  categories: Category[];
  currency: string;
  showSchedules: boolean;
  tagFallbackColor: string;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<number | null>(null);

  const term = normalize(query.trim());

  const groups = useMemo(() => {
    if (!term) return categories;
    return categories
      .map((c) => ({
        ...c,
        dishes: c.dishes.filter((d) =>
          normalize(`${d.name} ${d.description ?? ""} ${d.tags.map((t) => t.name).join(" ")}`).includes(term),
        ),
      }))
      .filter((c) => c.dishes.length > 0);
  }, [categories, term]);

  const total = groups.reduce((n, g) => n + g.dishes.length, 0);
  const current = active ?? categories[0]?.id ?? null;

  // Resalta la categoría que se está viendo
  const ids = groups.map((g) => g.id).join(",");
  useEffect(() => {
    if (term || !ids) return;
    const els = ids
      .split(",")
      .map((id) => document.getElementById(`cat-${id}`))
      .filter((el): el is HTMLElement => !!el);

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(Number(hit.target.id.slice(4)));
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids, term]);

  // Mantiene visible el chip activo en la barra horizontal
  useEffect(() => {
    if (current == null) return;
    document
      .getElementById(`chip-${current}`)
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [current]);

  if (categories.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-serif text-xl font-semibold">Estamos preparando el menú</p>
        <p className="mt-2 text-sm text-text/70">Vuelve a intentarlo en unos minutos.</p>
      </main>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-text/10 bg-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 pt-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text/50"
              aria-hidden="true"
            />
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en el menú..."
              aria-label="Buscar en el menú"
              className="w-full rounded-xl bg-text/5 py-3 pl-10 pr-11 text-base text-text outline-none ring-1 ring-text/10 placeholder:text-text/50 focus:ring-2 focus:ring-primary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Borrar búsqueda"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-text/60 hover:text-text"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {!term && (
          <nav aria-label="Categorías" className="mx-auto max-w-2xl">
            <ul className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((c) => {
                const on = c.id === current;
                return (
                  <li key={c.id} className="shrink-0">
                    <a
                      id={`chip-${c.id}`}
                      href={`#cat-${c.id}`}
                      onClick={() => setActive(c.id)}
                      aria-current={on ? "true" : undefined}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                        on
                          ? "bg-primary text-on-primary"
                          : "text-text ring-1 ring-text/20 hover:bg-text/5"
                      }`}
                    >
                      <CategoryIcon name={c.icon} className="size-4" />
                      {c.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
        {term && <div className="h-3" />}
      </div>

      <main className="mx-auto max-w-2xl px-4 pb-12 pt-4">
        {term && (
          <p role="status" aria-live="polite" className="mb-2 text-sm text-text/70">
            {total === 0
              ? "Sin resultados"
              : `${total} ${total === 1 ? "resultado" : "resultados"}`}
          </p>
        )}

        {groups.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-serif text-lg font-semibold">No encontramos ese plato</p>
            <p className="mt-1 text-sm text-text/70">Prueba con otra palabra.</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-on-primary"
            >
              Ver todo el menú
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((c) => (
              <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-36">
                <h2 className="flex items-center gap-2 border-b border-primary/30 pb-2 font-serif text-xl font-bold text-primary">
                  <CategoryIcon name={c.icon} className="size-5 shrink-0" />
                  {c.name}
                </h2>
                {c.description && <p className="mt-2 text-sm text-text/70">{c.description}</p>}

                <ul className="divide-y divide-text/10">
                  {c.dishes.map((d) => {
                    const dim = d.isAvailable ? "" : "opacity-60";
                    const hasSchedule =
                      showSchedules && d.showSchedule && d.scheduleFrom && d.scheduleTo;

                    return (
                      <li key={d.id} className="py-4">
                        <div className={`flex items-start justify-between gap-4 ${dim}`}>
                          <h3 className="min-w-0 font-semibold leading-snug">{d.name}</h3>
                          <p
                            className={`shrink-0 font-bold text-price ${
                              d.isAvailable ? "" : "line-through"
                            }`}
                          >
                            {formatPrice(d.priceCents, currency)}
                          </p>
                        </div>

                        {d.description && (
                          <p className={`mt-1 text-sm leading-relaxed text-text/70 ${dim}`}>
                            {d.description}
                          </p>
                        )}

                        {(!d.isAvailable || d.tags.length > 0 || hasSchedule) && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            {!d.isAvailable && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                                Agotado
                              </span>
                            )}
                            {d.tags.map((t) => (
                              <TagChip
                                key={t.id}
                                name={t.name}
                                color={t.color ?? tagFallbackColor}
                                icon={t.icon}
                              />
                            ))}
                            {hasSchedule && (
                              <span className="flex items-center gap-1 text-xs text-text/70">
                                <Clock className="size-3.5" aria-hidden="true" />
                                Disponible de {formatTime12(d.scheduleFrom)} hasta{" "}
                                {formatTime12(d.scheduleTo)}
                              </span>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}