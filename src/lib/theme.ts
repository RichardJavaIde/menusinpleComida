//src/lib/theme.ts
export const DEFAULT_THEME = {
  colorPrimary: "#B45309",
  colorSecondary: "#1F2937",
  colorBackground: "#FFFBF5",
  colorText: "#1F2937",
  colorPrice: "#15803D",
} as const;

export type ThemeColors = { [K in keyof typeof DEFAULT_THEME]: string };

export function themeToCssVars(t: ThemeColors): React.CSSProperties {
  return {
    "--brand-primary": t.colorPrimary,
    "--brand-secondary": t.colorSecondary,
    "--brand-bg": t.colorBackground,
    "--brand-text": t.colorText,
    "--brand-price": t.colorPrice,
  } as React.CSSProperties;
}

export const formatPrice = (cents: number, symbol: string) =>
  `${symbol} ${(cents / 100).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  export const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG entre dos colores hex: de 1 (igual) a 21 (blanco/negro) */
export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Blanco u oscuro, el que mejor se lea encima de un color de fondo */
export function readableOn(bg: string) {
  return contrastRatio(bg, "#FFFFFF") >= contrastRatio(bg, "#111827") ? "#FFFFFF" : "#111827";
}

export const THEME_PRESETS: { id: string; name: string; colors: ThemeColors }[] = [
  {
    id: "calido",
    name: "Cálido",
    colors: {
      colorPrimary: "#B45309", colorSecondary: "#1F2937", colorBackground: "#FFFBF5",
      colorText: "#1F2937", colorPrice: "#15803D",
    },
  },
  {
    id: "elegante",
    name: "Elegante oscuro",
    colors: {
      colorPrimary: "#F59E0B", colorSecondary: "#1E293B", colorBackground: "#0F172A",
      colorText: "#F1F5F9", colorPrice: "#FBBF24",
    },
  },
  {
    id: "fresco",
    name: "Fresco",
    colors: {
      colorPrimary: "#15803D", colorSecondary: "#14532D", colorBackground: "#F6FBF7",
      colorText: "#1C2B22", colorPrice: "#B45309",
    },
  },
  {
    id: "moderno",
    name: "Moderno",
    colors: {
      colorPrimary: "#1D4ED8", colorSecondary: "#0F172A", colorBackground: "#F8FAFC",
      colorText: "#0F172A", colorPrice: "#0F766E",
    },
  },
];