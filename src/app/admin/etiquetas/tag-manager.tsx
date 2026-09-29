//src/app/admin/etiquetas/tag-manager.tsx
"use client";

import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
import {
  ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X,
} from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { TagChip } from "@/components/tag-chip";
import { useToast } from "@/components/toast";
import { ICON_KEYS } from "@/lib/icon-keys";
import type { ActionResult } from "@/lib/action-result";
import {
  saveTag, toggleTagActive, moveTag, deleteTag, type TagFormState,
} from "./actions";

type Tag = {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  dishCount: number;
};

const COLORS = [
  { value: "#B45309", label: "Ámbar" },
  { value: "#C2410C", label: "Naranja" },
  { value: "#B91C1C", label: "Rojo" },
  { value: "#BE185D", label: "Rosa" },
  { value: "#6D28D9", label: "Violeta" },
  { value: "#1D4ED8", label: "Azul" },
  { value: "#0F766E", label: "Turquesa" },
  { value: "#15803D", label: "Verde" },
  { value: "#374151", label: "Gris" },
];

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20";

const iconBtn =
  "rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent";

export function TagManager({ tags }: { tags: Tag[] }) {
  const [editing, setEditing] = useState<Tag | "new" | null>(null);
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

  const onDelete = (t: Tag) => {
    const msg =
      t.dishCount > 0
        ? `"${t.name}" está en ${t.dishCount} plato(s). Si la eliminas, se quitará de todos ellos. ¿Continuar?`
        : `¿Eliminar la etiqueta "${t.name}"?`;
    if (confirm(msg)) run(() => deleteTag(t.id));
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800"
        >
          <Plus className="size-4" />
          Nueva etiqueta
        </button>
      </div>

      {tags.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="font-medium">Aún no hay etiquetas</p>
          <p className="mt-1 text-sm text-stone-500">
            Crea la primera, por ejemplo "Popular" o "Picante". Son totalmente opcionales.
          </p>
        </div>
      ) : (
        <ul className={`space-y-2 ${pending ? "opacity-70" : ""}`}>
          {tags.map((t, i) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-stone-200 sm:flex-nowrap"
            >
              <div className={`min-w-0 flex-1 ${t.isActive ? "" : "opacity-50"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <TagChip name={t.name} color={t.color} icon={t.icon} />
                  {!t.isActive && (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                      Inactiva
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-stone-500">
                  {t.dishCount === 0
                    ? "Sin platos"
                    : `${t.dishCount} ${t.dishCount === 1 ? "plato" : "platos"}`}
                </p>
              </div>

              <div className="flex shrink-0 items-center">
                <button
                  className={iconBtn}
                  aria-label={`Subir ${t.name}`}
                  disabled={pending || i === 0}
                  onClick={() => run(() => moveTag(t.id, "up"), true)}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  className={iconBtn}
                  aria-label={`Bajar ${t.name}`}
                  disabled={pending || i === tags.length - 1}
                  onClick={() => run(() => moveTag(t.id, "down"), true)}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  className={iconBtn}
                  aria-label={t.isActive ? `Desactivar ${t.name}` : `Activar ${t.name}`}
                  title={t.isActive ? "Desactivar" : "Activar"}
                  disabled={pending}
                  onClick={() => run(() => toggleTagActive(t.id))}
                >
                  {t.isActive ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                <button
                  className={iconBtn}
                  aria-label={`Editar ${t.name}`}
                  onClick={() => setEditing(t)}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600`}
                  aria-label={`Eliminar ${t.name}`}
                  disabled={pending}
                  onClick={() => onDelete(t)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <TagDialog tag={editing === "new" ? null : editing} onClose={closeDialog} />
      )}
    </>
  );
}

function TagDialog({ tag, onClose }: { tag: Tag | null; onClose: () => void }) {
  const [state, action, pending] = useActionState<TagFormState, FormData>(saveTag, {});
  const [, startTransition] = useTransition();
  const toast = useToast();

  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? "");
  const [icon, setIcon] = useState(tag?.icon ?? "");

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
        aria-labelledby="tag-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="tag-title" className="text-lg font-semibold">
            {tag ? "Editar etiqueta" : "Nueva etiqueta"}
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
          {tag && <input type="hidden" name="id" value={tag.id} />}

          <div className="flex min-h-14 items-center justify-center rounded-xl bg-stone-50 p-3">
            <TagChip name={name.trim() || "Vista previa"} color={color} icon={icon} />
          </div>

          <div>
            <label htmlFor="tag-name" className="mb-1 block text-sm font-medium text-stone-700">
              Nombre
            </label>
            <input
              id="tag-name"
              name="name"
              required
              maxLength={30}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-stone-700">Color</legend>
            <div className="flex flex-wrap gap-2">
              <label title="Predeterminado" className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value=""
                  checked={color === ""}
                  onChange={() => setColor("")}
                  className="peer sr-only"
                  aria-label="Color predeterminado"
                />
                <span className="flex size-9 items-center justify-center rounded-full bg-amber-50 text-amber-800 ring-1 ring-stone-300 peer-checked:ring-2 peer-checked:ring-stone-900 peer-focus-visible:ring-2 peer-focus-visible:ring-stone-900">
                  <X className="size-4" />
                </span>
              </label>
              {COLORS.map((c) => (
                <label key={c.value} title={c.label} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={c.value}
                    checked={color === c.value}
                    onChange={() => setColor(c.value)}
                    className="peer sr-only"
                    aria-label={c.label}
                  />
                  <span
                    className="block size-9 rounded-full ring-2 ring-transparent ring-offset-2 peer-checked:ring-stone-900 peer-focus-visible:ring-stone-900"
                    style={{ backgroundColor: c.value }}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-stone-700">
              Icono <span className="font-normal text-stone-400">(opcional)</span>
            </legend>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              <label title="Sin icono" className="cursor-pointer">
                <input
                  type="radio"
                  name="icon"
                  value=""
                  checked={icon === ""}
                  onChange={() => setIcon("")}
                  className="peer sr-only"
                  aria-label="Sin icono"
                />
                <span className="flex aspect-square items-center justify-center rounded-lg text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50 peer-checked:bg-amber-100 peer-checked:text-amber-900 peer-checked:ring-2 peer-checked:ring-amber-600 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-600">
                  <X className="size-5" />
                </span>
              </label>
              {ICON_KEYS.map((key) => (
                <label key={key} title={key} className="cursor-pointer">
                  <input
                    type="radio"
                    name="icon"
                    value={key}
                    checked={icon === key}
                    onChange={() => setIcon(key)}
                    className="peer sr-only"
                    aria-label={key}
                  />
                  <span className="flex aspect-square items-center justify-center rounded-lg text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50 peer-checked:bg-amber-100 peer-checked:text-amber-900 peer-checked:ring-2 peer-checked:ring-amber-600 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-600">
                    <CategoryIcon name={key} className="size-5" />
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={tag?.isActive ?? true}
              className="size-4 accent-amber-700"
            />
            <span className="text-sm">Activa (se puede asignar y se muestra al cliente)</span>
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