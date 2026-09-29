//src/app/admin/qr/qr-generator.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { toDataURL } from "qrcode";
import { AlertTriangle, Check, Copy, Download, Loader2, QrCode } from "lucide-react";
import { useToast } from "@/components/toast";
import { isPrivateHost, menuUrlFrom } from "@/lib/site-url";

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20";

const btnSecondary =
  "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-stone-700 ring-1 ring-stone-300 transition hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-transparent";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Copia al portapapeles. Si el navegador no lo permite (por ejemplo http en red local), usa un respaldo. */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* se usa el respaldo */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function QrGenerator({
  defaultSite,
  restaurantName,
}: {
  defaultSite: string;
  restaurantName: string;
}) {
  const [site, setSite] = useState(defaultSite);
  const [link, setLink] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const generate = useCallback(
    async (input: string, announce: boolean) => {
      const target = menuUrlFrom(input);
      if (!target) {
        setError("Escribe una dirección válida, por ejemplo https://midominio.com");
        return;
      }
      setError(null);
      setBusy(true);
      try {
        const url = await toDataURL(target, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 1024,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        setLink(target);
        setDataUrl(url);
        if (announce) toast.success("Código QR generado.");
      } catch {
        toast.error("No se pudo generar el QR. Inténtalo de nuevo.");
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );

  // Genera uno al abrir la página con la dirección por defecto
  useEffect(() => {
    generate(defaultSite, false);
  }, [generate, defaultSite]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-menu-${slugify(restaurantName) || "menu"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Descarga del QR iniciada.");
  };

  const copy = async () => {
    if (!link) return;
    if (await copyText(link)) {
      setCopied(true);
      toast.success("Enlace copiado.");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("No se pudo copiar. Selecciona el enlace y cópialo a mano.");
    }
  };

  const stale = link !== null && menuUrlFrom(site) !== link;
  const isLocal = link ? isPrivateHost(link) : false;
  const isInsecure = link ? link.startsWith("http://") && !isLocal : false;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generate(site, true);
          }}
          className="rounded-2xl bg-white p-5 ring-1 ring-stone-200"
        >
          <label htmlFor="site" className="mb-1 block text-sm font-medium text-stone-700">
            Dirección del sitio
          </label>
          <input
            id="site"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://midominio.com"
            aria-invalid={!!error}
            aria-describedby="site-help"
            className={inputCls}
          />
          <p id="site-help" className="mt-1 text-xs text-stone-500">
            Se agrega <span className="font-mono">/menu</span> automáticamente. Usa aquí el
            dominio definitivo antes de imprimir.
          </p>

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800 disabled:opacity-60 sm:w-auto"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
            Generar QR
          </button>
        </form>

        {link && (
          <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
            <p className="text-sm font-medium text-stone-700">Enlace del QR</p>
            <p className="mt-1 break-all rounded-lg bg-stone-50 px-3 py-2 font-mono text-sm">
              {link}
            </p>

            {stale && (
              <p role="status" className="mt-3 text-sm text-amber-800">
                Cambiaste la dirección. Pulsa <strong>Generar QR</strong> para actualizar el
                código.
              </p>
            )}

            {isLocal && (
              <div
                role="status"
                className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>
                  Esta dirección solo funciona en tu computadora o tu red local. No la imprimas:
                  los clientes no podrán abrirla. Úsala solo para probar.
                </p>
              </div>
            )}

            {isInsecure && (
              <div
                role="status"
                className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>
                  La dirección usa http. Si tu dominio tiene certificado, usa https: algunos
                  teléfonos muestran una advertencia al abrir sitios sin él.
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={download} disabled={!dataUrl} className={btnSecondary}>
                <Download className="size-4" />
                Descargar QR
              </button>
              <button type="button" onClick={copy} className={btnSecondary}>
                {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                {copied ? "Copiado" : "Copiar enlace"}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white p-5 text-sm text-stone-600 ring-1 ring-stone-200">
          <p className="mb-2 font-medium text-stone-900">Antes de imprimir</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Tamaño mínimo recomendado: 3 × 3 cm. Para mesas, 5 × 5 cm o más.</li>
            <li>Imprímelo con tinta oscura sobre fondo blanco y sin estirarlo.</li>
            <li>Escanéalo con dos teléfonos distintos (Android y iPhone) antes de imprimir todo.</li>
            <li>Si cambias de dominio, genera y reimprime el QR. Los colores y platos del menú sí se actualizan solos.</li>
          </ul>
        </div>
      </div>

      <aside>
        <div className="sticky top-6 rounded-2xl bg-white p-5 text-center ring-1 ring-stone-200">
          <p className="font-semibold">{restaurantName}</p>
          <p className="mb-4 text-sm text-stone-500">Escanea para ver el menú</p>

          <div className="mx-auto flex aspect-square w-full max-w-64 items-center justify-center rounded-xl bg-white ring-1 ring-stone-200">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt={`Código QR que abre ${link}`}
                width={256}
                height={256}
                className={`size-full rounded-xl ${stale ? "opacity-40" : ""}`}
              />
            ) : (
              <Loader2 className="size-6 animate-spin text-stone-400" aria-label="Generando" />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}