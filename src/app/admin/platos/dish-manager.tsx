//src/app/admin/platos/dish-manager.tsx
"use client";

import Link from "next/link";
import {
  useActionState, useCallback, useEffect, useMemo, useState, useTransition,
} from "react";
import {
  ArrowDown, ArrowUp, Ban, CheckCircle2, Clock, Eye, EyeOff, Loader2,
  Pencil, Plus, Search, Trash2, X,
} from "lucide-react";
import { useToast } from "@/components/toast";
import { formatPrice } from "@/lib/theme";
import { centsToInput } from "@/lib/price";
import { formatTime12 } from "@/lib/time";
import type { ActionResult } from "@/lib/action-result";
import {
  saveDish, toggleDishVisibility, toggleDishAvailability, moveDish, deleteDish,
  type DishFormState,
} from "./actions";
import { TagChip } from "@/components/tag-chip";

type Tag = { id: number; name: string; color?: string | null; icon?: string | null };
type Category = { id: number; name: string; isVisible: boolean };
type Dish = {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  categoryId: number;
  isVisible: boolean;
  isAvailable: boolean;
  showSchedule: boolean;
  scheduleFrom: string | null;
  scheduleTo: string | null;
  tags: Tag[];
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20";

const iconBtn =
  "rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent";

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function DishManager({
  dishes, categories, tags, currency,
}: {
  dishes: Dish[];
  categories: Category[];
  tags: Tag[];
  currency: string;
}) {
  const [editing, setEditing] = useState<Dish | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<number | "all">("all");
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const closeDialog = useCallback(() => setEditing(null), []);

  const run = (fn: () => Promise<ActionResult>, silentOnSuccess = false) =>
    startTransition(async () => {
      try {
        const result = await fn();
        if (result.ok) {
          if (!silentOnSuccess) {
            if (result.tone === "danger") toast.danger(result.message);
            else toast.success(result.message);
          }
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Ocurrió un error inesperado. Inténtalo de nuevo.");
      }
    });

  const groups = useMemo(() => {
    const term = normalize(query.trim());
    return categories
      .filter((c) => filterCat === "all" || c.id === filterCat)
      .map((category) => {
        const all = dishes.filter((d) => d.categoryId === category.id);
        const shown = term
          ? all.filter((d) => normalize(`${d.name} ${d.description ?? ""}`).includes(term))
          : all;
        return { category, all, shown };
      })
      .filter((g) => g.shown.length > 0);
  }, [dishes, categories, query, filterCat]);

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
        <p className="font-medium">Primero crea una categoría</p>
        <p className="mt-1 text-sm text-stone-500">
          Cada plato pertenece a una categoría, por ejemplo "Entradas" o "Bebidas".
        </p>
        <Link
          href="/admin/categorias"
          className="mt-4 inline-block rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-800"
        >
          Ir a categorías
        </Link>
      </div>
    );
  }

  const onDelete = (d: Dish) => {
    if (confirm(`¿Eliminar el plato "${d.name}"?`)) run(() => deleteDish(d.id));
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar plato..."
            aria-label="Buscar plato"
            className={`${inputCls} pl-9`}
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) =>
            setFilterCat(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          aria-label="Filtrar por categoría"
          className={`${inputCls} sm:w-56`}
        >
          <option value="all">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800"
        >
          <Plus className="size-4" />
          Nuevo plato
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="font-medium">
            {dishes.length === 0 ? "Aún no hay platos" : "Sin resultados"}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {dishes.length === 0
              ? "Crea el primero con el botón \"Nuevo plato\"."
              : "Prueba con otra búsqueda o cambia el filtro."}
          </p>
        </div>
      ) : (
        <div className={`space-y-6 ${pending ? "opacity-70" : ""}`}>
          {groups.map(({ category, all, shown }) => (
            <section key={category.id}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
                {category.name}
                <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium normal-case tracking-normal text-stone-600">
                  {all.length}
                </span>
                {!category.isVisible && (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium normal-case tracking-normal text-stone-500">
                    Categoría oculta
                  </span>
                )}
              </h2>

              <ul className="space-y-2">
                {shown.map((d) => {
                  const isFirst = all[0]?.id === d.id;
                  const isLast = all[all.length - 1]?.id === d.id;
                  const hasSchedule =
                    d.showSchedule && d.scheduleFrom && d.scheduleTo;

                  return (
                    <li
                      key={d.id}
                      className="rounded-xl bg-white p-3 ring-1 ring-stone-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="font-medium">{d.name}</p>
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
                          {d.description && (
                            <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">
                              {d.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {d.tags.map((t) => (
  <TagChip key={t.id} name={t.name} color={t.color} icon={t.icon} />
))}
                            {hasSchedule && (
                              <span className="flex items-center gap-1 text-xs text-stone-500">
                                <Clock className="size-3.5" />
                                {formatTime12(d.scheduleFrom)} – {formatTime12(d.scheduleTo)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="shrink-0 font-semibold text-green-700">
                          {formatPrice(d.priceCents, currency)}
                        </p>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-end border-t border-stone-100 pt-2">
                        <button
                          className={iconBtn}
                          aria-label={`Subir ${d.name}`}
                          disabled={pending || isFirst}
                          onClick={() => run(() => moveDish(d.id, "up"), true)}
                        >
                          <ArrowUp className="size-4" />
                        </button>
                        <button
                          className={iconBtn}
                          aria-label={`Bajar ${d.name}`}
                          disabled={pending || isLast}
                          onClick={() => run(() => moveDish(d.id, "down"), true)}
                        >
                          <ArrowDown className="size-4" />
                        </button>
                        <button
                          className={iconBtn}
                          aria-label={d.isAvailable ? `Marcar ${d.name} como agotado` : `Marcar ${d.name} como disponible`}
                          title={d.isAvailable ? "Marcar como agotado" : "Marcar como disponible"}
                          disabled={pending}
                          onClick={() => run(() => toggleDishAvailability(d.id))}
                        >
                          {d.isAvailable ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                        </button>
                        <button
                          className={iconBtn}
                          aria-label={d.isVisible ? `Ocultar ${d.name}` : `Mostrar ${d.name}`}
                          title={d.isVisible ? "Ocultar del menú" : "Mostrar en el menú"}
                          disabled={pending}
                          onClick={() => run(() => toggleDishVisibility(d.id))}
                        >
                          {d.isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                        </button>
                        <button
                          className={iconBtn}
                          aria-label={`Editar ${d.name}`}
                          onClick={() => setEditing(d)}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600`}
                          aria-label={`Eliminar ${d.name}`}
                          disabled={pending}
                          onClick={() => onDelete(d)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <DishDialog
          dish={editing === "new" ? null : editing}
          categories={categories}
          tags={tags}
          currency={currency}
          defaultCategoryId={filterCat === "all" ? categories[0].id : filterCat}
          onClose={closeDialog}
        />
      )}
    </>
  );
}

function DishDialog({
  dish, categories, tags, currency, defaultCategoryId, onClose,
}: {
  dish: Dish | null;
  categories: Category[];
  tags: Tag[];
  currency: string;
  defaultCategoryId: number;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<DishFormState, FormData>(saveDish, {});
  const [, startTransition] = useTransition();
  const [showSchedule, setShowSchedule] = useState(dish?.showSchedule ?? false);
  const toast = useToast();

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Guardado.");
      onClose();
    }
  }, [state, toast, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const selectedTags = new Set(dish?.tags.map((t) => t.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="dish-title" className="text-lg font-semibold">
            {dish ? "Editar plato" : "Nuevo plato"}
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className={iconBtn}>
            <X className="size-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(() => action(fd));
          }}
          className="space-y-4"
        >
          {dish && <input type="hidden" name="id" value={dish.id} />}

          <div>
            <label htmlFor="dish-name" className="mb-1 block text-sm font-medium text-stone-700">
              Nombre
            </label>
            <input
              id="dish-name"
              name="name"
              required
              maxLength={80}
              autoFocus
              defaultValue={dish?.name}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="dish-desc" className="mb-1 block text-sm font-medium text-stone-700">
              Descripción <span className="font-normal text-stone-400">(opcional)</span>
            </label>
            <textarea
              id="dish-desc"
              name="description"
              rows={3}
              maxLength={300}
              defaultValue={dish?.description ?? ""}
              className={inputCls}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dish-price" className="mb-1 block text-sm font-medium text-stone-700">
                Precio
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">
                  {currency}
                </span>
                <input
                  id="dish-price"
                  name="price"
                  required
                  inputMode="decimal"
                  placeholder="0.00"
                  defaultValue={dish ? centsToInput(dish.priceCents) : ""}
                  className={`${inputCls} pl-12`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="dish-cat" className="mb-1 block text-sm font-medium text-stone-700">
                Categoría
              </label>
              <select
                id="dish-cat"
                name="categoryId"
                required
                defaultValue={dish?.categoryId ?? defaultCategoryId}
                className={inputCls}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-stone-700">
              Etiquetas <span className="font-normal text-stone-400">(opcional)</span>
            </legend>
            {tags.length === 0 ? (
              <p className="text-sm text-stone-500">No hay etiquetas activas.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <label key={t.id} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="tagIds"
                      value={t.id}
                      defaultChecked={selectedTags.has(t.id)}
                      className="peer sr-only"
                    />
                    <span className="block rounded-full px-3 py-1.5 text-sm text-stone-600 ring-1 ring-stone-300 transition hover:bg-stone-50 peer-checked:bg-amber-100 peer-checked:text-amber-900 peer-checked:ring-2 peer-checked:ring-amber-600 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-600">
                      {t.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="rounded-xl bg-stone-50 p-3">
            <legend className="sr-only">Horario informativo</legend>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="showSchedule"
                checked={showSchedule}
                onChange={(e) => setShowSchedule(e.target.checked)}
                className="size-4 accent-amber-700"
              />
              <span className="text-sm font-medium">Mostrar horario informativo</span>
            </label>
            <p className="mt-1 pl-7 text-xs text-stone-500">
              Solo es un texto para el cliente. No oculta ni muestra el plato.
            </p>

            <div className={`mt-3 grid grid-cols-2 gap-3 pl-7 ${showSchedule ? "" : "opacity-50"}`}>
              <div>
                <label htmlFor="dish-from" className="mb-1 block text-xs font-medium text-stone-600">
                  Disponible desde
                </label>
                <input
                  id="dish-from"
                  name="scheduleFrom"
                  type="time"
                  defaultValue={dish?.scheduleFrom ?? ""}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="dish-to" className="mb-1 block text-xs font-medium text-stone-600">
                  Hasta
                </label>
                <input
                  id="dish-to"
                  name="scheduleTo"
                  type="time"
                  defaultValue={dish?.scheduleTo ?? ""}
                  className={inputCls}
                />
              </div>
            </div>
          </fieldset>

          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isVisible"
                defaultChecked={dish?.isVisible ?? true}
                className="size-4 accent-amber-700"
              />
              <span className="text-sm">Visible en el menú público</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isAvailable"
                defaultChecked={dish?.isAvailable ?? true}
                className="size-4 accent-amber-700"
              />
              <span className="text-sm">Disponible (si lo desmarcas, se muestra como "Agotado")</span>
            </label>
          </div>

          {state.error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}