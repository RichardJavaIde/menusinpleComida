//src/app/admin/configuracion/settings-form.tsx
"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { AlertTriangle, Clock, Loader2, RotateCcw, Save } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { TagChip } from "@/components/tag-chip";
import { useToast } from "@/components/toast";
import {
  DEFAULT_THEME, HEX_RE, THEME_PRESETS, contrastRatio, formatPrice, readableOn,
  type ThemeColors,
} from "@/lib/theme";
import { saveSettings, type SettingsFormState } from "./actions";

type Values = ThemeColors & {
  restaurantName: string;
  slogan: string;
  phone: string;
  address: string;
  currencySymbol: string;
  showSchedules: boolean;
};

const COLOR_FIELDS: { key: keyof ThemeColors; label: string; hint: string }[] = [
  { key: "colorPrimary", label: "Color principal", hint: "Títulos de categoría, iconos y botones." },
  { key: "colorSecondary", label: "Color secundario", hint: "Fondo de la cabecera del menú." },
  { key: "colorBackground", label: "Color de fondo", hint: "Fondo general de la página." },
  { key: "colorText", label: "Color del texto", hint: "Nombres y descripciones de los platos." },
  { key: "colorPrice", label: "Color de los precios", hint: "Precio de cada plato." },
];

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20";

const cardCls = "rounded-2xl bg-white p-5 ring-1 ring-stone-200";

const pick = (c: string, fallback: string) => (HEX_RE.test(c) ? c : fallback);

export function SettingsForm({ initial }: { initial: Values }) {
  const [v, setV] = useState<Values>(initial);
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(saveSettings, {});
  const [, startTransition] = useTransition();
  const toast = useToast();

  useEffect(() => {
    if (state.success) toast.success(state.message ?? "Guardado.");
  }, [state, toast]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  // Avisos de legibilidad (no bloquean el guardado)
  const bg = pick(v.colorBackground, DEFAULT_THEME.colorBackground);
  const text = pick(v.colorText, DEFAULT_THEME.colorText);
  const price = pick(v.colorPrice, DEFAULT_THEME.colorPrice);
  const primary = pick(v.colorPrimary, DEFAULT_THEME.colorPrimary);

  const warnings: string[] = [];
  if (contrastRatio(text, bg) < 4.5) warnings.push("El texto casi no se distingue del fondo.");
  if (contrastRatio(price, bg) < 4.5) warnings.push("Los precios casi no se distinguen del fondo.");
  if (contrastRatio(primary, bg) < 3) warnings.push("El color principal casi no se distingue del fondo.");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
    >
      <div className="space-y-6">
        {/* Datos del negocio */}
        <section className={cardCls}>
          <h2 className="mb-4 font-semibold">Datos del negocio</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="restaurantName" className="mb-1 block text-sm font-medium text-stone-700">
                Nombre del negocio
              </label>
              <input
                id="restaurantName"
                name="restaurantName"
                required
                maxLength={60}
                value={v.restaurantName}
                onChange={(e) => set("restaurantName", e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="slogan" className="mb-1 block text-sm font-medium text-stone-700">
                Eslogan <span className="font-normal text-stone-400">(opcional)</span>
              </label>
              <input
                id="slogan"
                name="slogan"
                maxLength={120}
                value={v.slogan}
                onChange={(e) => set("slogan", e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-stone-700">
                  Teléfono <span className="font-normal text-stone-400">(opcional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={30}
                  value={v.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="currencySymbol" className="mb-1 block text-sm font-medium text-stone-700">
                  Símbolo de moneda
                </label>
                <input
                  id="currencySymbol"
                  name="currencySymbol"
                  required
                  maxLength={8}
                  value={v.currencySymbol}
                  onChange={(e) => set("currencySymbol", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="mb-1 block text-sm font-medium text-stone-700">
                Dirección <span className="font-normal text-stone-400">(opcional)</span>
              </label>
              <input
                id="address"
                name="address"
                maxLength={200}
                value={v.address}
                onChange={(e) => set("address", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* Horarios */}
        <section className={cardCls}>
          <h2 className="mb-1 font-semibold">Horarios de los platos</h2>
          <label className="mt-3 flex items-start gap-3">
            <input
              type="checkbox"
              name="showSchedules"
              checked={v.showSchedules}
              onChange={(e) => set("showSchedules", e.target.checked)}
              className="mt-0.5 size-4 accent-amber-700"
            />
            <span className="text-sm">
              Mostrar horarios en el menú público
              <span className="mt-1 block text-xs text-stone-500">
                Es un interruptor general. Apagado, ningún plato muestra su horario, aunque
                lo tenga activado. Encendido, cada plato lo muestra solo si tiene el suyo
                activo. El horario nunca oculta ni muestra un plato.
              </span>
            </span>
          </label>
        </section>

        {/* Apariencia */}
        <section className={cardCls}>
          <h2 className="mb-1 font-semibold">Apariencia del menú</h2>
          <p className="mb-4 text-sm text-stone-500">
            Estos colores solo afectan al menú público. El panel de administración mantiene sus
            colores fijos para que siempre sea legible.
          </p>

          <p className="mb-2 text-sm font-medium text-stone-700">Paletas listas</p>
          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {THEME_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setV((prev) => ({ ...prev, ...p.colors }))}
                className="rounded-xl p-2 text-left ring-1 ring-stone-200 transition hover:bg-stone-50 hover:ring-stone-300"
              >
                <span className="mb-1.5 flex overflow-hidden rounded-md ring-1 ring-black/5">
                  {[p.colors.colorSecondary, p.colors.colorPrimary, p.colors.colorBackground, p.colors.colorPrice].map(
                    (c, i) => (
                      <span key={i} className="h-6 flex-1" style={{ backgroundColor: c }} />
                    ),
                  )}
                </span>
                <span className="text-xs font-medium text-stone-700">{p.name}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {COLOR_FIELDS.map((f) => (
              <ColorField
                key={f.key}
                id={f.key}
                name={f.key}
                label={f.label}
                hint={f.hint}
                value={v[f.key]}
                onChange={(c) => set(f.key, c)}
              />
            ))}
          </div>

          {warnings.length > 0 && (
            <div
              role="status"
              className="mt-4 flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <ul className="space-y-0.5">
                {warnings.map((w) => (
                  <li key={w}>{w} Puede costar leerlo en el teléfono.</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setV((prev) => ({ ...prev, ...DEFAULT_THEME }));
              toast.success("Colores restaurados. Pulsa Guardar para aplicarlos.");
            }}
            className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 ring-1 ring-stone-300 hover:bg-stone-50"
          >
            <RotateCcw className="size-4" />
            Restaurar colores predeterminados
          </button>

          {/* Vista previa en móvil */}
          <div className="mt-6 lg:hidden">
            <MenuPreview v={v} />
          </div>
        </section>

        {/* Barra de guardado */}
        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-stone-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
          <div className="min-w-0 text-sm">
            {state.error ? (
              <p role="alert" className="text-red-700">{state.error}</p>
            ) : (
              <p className="text-stone-500">Los cambios se aplican al menú público al guardar.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-amber-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar
          </button>
        </div>
      </div>

      {/* Vista previa en escritorio */}
      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <MenuPreview v={v} />
        </div>
      </aside>
    </form>
  );
}

function ColorField({
  id, name, label, hint, value, onChange,
}: {
  id: string;
  name: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const valid = HEX_RE.test(value);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`Selector de ${label.toLowerCase()}`}
          value={valid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
        />
        <input
          id={id}
          name={name}
          value={value}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={!valid}
          onChange={(e) => {
            let next = e.target.value.trim();
            if (next && !next.startsWith("#")) next = `#${next}`;
            onChange(next.slice(0, 7).toUpperCase());
          }}
          className={`${inputCls} font-mono ${valid ? "" : "!border-red-400"}`}
        />
      </div>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
    </div>
  );
}

function MenuPreview({ v }: { v: Values }) {
  const primary = pick(v.colorPrimary, DEFAULT_THEME.colorPrimary);
  const secondary = pick(v.colorSecondary, DEFAULT_THEME.colorSecondary);
  const bg = pick(v.colorBackground, DEFAULT_THEME.colorBackground);
  const text = pick(v.colorText, DEFAULT_THEME.colorText);
  const price = pick(v.colorPrice, DEFAULT_THEME.colorPrice);
  const symbol = v.currencySymbol.trim() || "RD$";

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
        Vista previa
      </p>
      <div
        className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-stone-300"
        style={{ backgroundColor: bg, color: text }}
      >
        <div className="px-4 py-5 text-center" style={{ backgroundColor: secondary, color: readableOn(secondary) }}>
          <p className="text-lg font-bold">{v.restaurantName.trim() || "Mi Restaurante"}</p>
          {v.slogan.trim() && <p className="mt-0.5 text-xs opacity-80">{v.slogan.trim()}</p>}
        </div>

        <div className="flex gap-2 px-4 pt-4">
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: primary, color: readableOn(primary) }}
          >
            Entradas
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ border: `1px solid ${text}40` }}
          >
            Bebidas
          </span>
        </div>

        <div className="px-4 pb-5 pt-4">
          <h3
            className="flex items-center gap-2 border-b pb-2 text-sm font-bold uppercase tracking-wide"
            style={{ color: primary, borderColor: `${primary}40` }}
          >
            <CategoryIcon name="salad" className="size-4" />
            Entradas
          </h3>

          <div className="mt-3 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Tostones con queso frito</p>
                <p className="mt-0.5 text-xs opacity-70">Plátano verde crujiente con queso frito.</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <TagChip name="Popular" color={primary} />
                  {v.showSchedules && (
                    <span className="flex items-center gap-1 text-xs opacity-70">
                      <Clock className="size-3" />
                      11:00 AM – 3:00 PM
                    </span>
                  )}
                </div>
              </div>
              <p className="shrink-0 text-sm font-bold" style={{ color: price }}>
                {formatPrice(35000, symbol)}
              </p>
            </div>

            <div className="flex items-start justify-between gap-3 opacity-60">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Ensalada de la casa</p>
                <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  Agotado
                </span>
              </div>
              <p className="shrink-0 text-sm font-bold" style={{ color: price }}>
                {formatPrice(28000, symbol)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}