//src/app/admin/categorias/category-manager.tsx
"use client";

import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
import {
  ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X,
} from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { useToast } from "@/components/toast";
import { ICON_KEYS } from "@/lib/icon-keys";
import type { ActionResult } from "@/lib/action-result";
import {
  saveCategory, toggleCategoryVisibility, moveCategory, deleteCategory,
  type CategoryFormState,
} from "./actions";

type Category = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  isVisible: boolean;
  dishCount: number;
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20";

const iconBtn =
  "rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState<Category | "new" | null>(null);
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

  const onDelete = (c: Category) => {
  if (c.dishCount > 0) {
    toast.error(
      `No se puede eliminar "${c.name}" porque tiene ${c.dishCount} ${
        c.dishCount === 1 ? "plato" : "platos"
      }. Muévelos a otra categoría o elimínalos primero.`,
    );
    return;
  }
  if (confirm(`¿Eliminar la categoría "${c.name}"?`)) run(() => deleteCategory(c.id));
};

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800"
        >
          <Plus className="size-4" />
          Nueva categoría
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="font-medium">Aún no hay categorías</p>
          <p className="mt-1 text-sm text-stone-500">
            Crea la primera, por ejemplo "Entradas" o "Bebidas".
          </p>
        </div>
      ) : (
        <ul className={`space-y-2 ${pending ? "opacity-70" : ""}`}>
          {categories.map((c, i) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-stone-200 sm:flex-nowrap"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                <CategoryIcon name={c.icon} className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{c.name}</p>
                  {!c.isVisible && (
                    <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                      Oculta
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-stone-500">
                  {c.dishCount} {c.dishCount === 1 ? "plato" : "platos"}
                  {c.description ? ` · ${c.description}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center">
                <button
                  className={iconBtn}
                  aria-label={`Subir ${c.name}`}
                  disabled={pending || i === 0}
                  onClick={() => run(() => moveCategory(c.id, "up"), true)}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  className={iconBtn}
                  aria-label={`Bajar ${c.name}`}
                  disabled={pending || i === categories.length - 1}
                  onClick={() => run(() => moveCategory(c.id, "down"), true)}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  className={iconBtn}
                  aria-label={c.isVisible ? `Ocultar ${c.name}` : `Mostrar ${c.name}`}
                  disabled={pending}
                  onClick={() => run(() => toggleCategoryVisibility(c.id))}
                >
                  {c.isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                <button
                  className={iconBtn}
                  aria-label={`Editar ${c.name}`}
                  onClick={() => setEditing(c)}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600`}
                  aria-label={`Eliminar ${c.name}`}
                  disabled={pending}
                  onClick={() => onDelete(c)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <CategoryDialog
          category={editing === "new" ? null : editing}
          onClose={closeDialog}
        />
      )}
    </>
  );
}

function CategoryDialog({
  category,
  onClose,
}: {
  category: Category | null;
  onClose: () => void;
}) {
 const [state, action, pending] = useActionState<CategoryFormState, FormData>(saveCategory, {});
const [, startTransition] = useTransition();
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cat-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="cat-title" className="text-lg font-semibold">
            {category ? "Editar categoría" : "Nueva categoría"}
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
          {category && <input type="hidden" name="id" value={category.id} />}

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-stone-700">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={60}
              autoFocus
              defaultValue={category?.name}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-stone-700">
              Descripción <span className="font-normal text-stone-400">(opcional)</span>
            </label>
            <input
              id="description"
              name="description"
              maxLength={200}
              defaultValue={category?.description ?? ""}
              className={inputCls}
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-stone-700">Icono</legend>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              <IconOption value="" label="Sin icono" checked={!category?.icon}>
                <X className="size-5" />
              </IconOption>
              {ICON_KEYS.map((key) => (
                <IconOption key={key} value={key} label={key} checked={category?.icon === key}>
                  <CategoryIcon name={key} className="size-5" />
                </IconOption>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isVisible"
              defaultChecked={category?.isVisible ?? true}
              className="size-4 accent-amber-700"
            />
            <span className="text-sm">Visible en el menú público</span>
          </label>

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

function IconOption({
  value, label, checked, children,
}: {
  value: string;
  label: string;
  checked: boolean;
  children: React.ReactNode;
}) {
  return (
    <label title={label} className="cursor-pointer">
      <input
        type="radio"
        name="icon"
        value={value}
        defaultChecked={checked}
        className="peer sr-only"
        aria-label={label}
      />
      <span className="flex aspect-square items-center justify-center rounded-lg text-stone-600 ring-1 ring-stone-200 transition hover:bg-stone-50 peer-checked:bg-amber-100 peer-checked:text-amber-900 peer-checked:ring-2 peer-checked:ring-amber-600 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-600">
        {children}
      </span>
    </label>
  );
}